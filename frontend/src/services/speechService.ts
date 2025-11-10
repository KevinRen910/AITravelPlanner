import { message } from 'antd';

class SpeechService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isBackendAvailable: boolean = false;
  // 语音服务 URL，可配置为完整地址或相对路径（例如 http://localhost:5000/api/speech 或 /api/speech）
  private speechServiceUrl = import.meta.env.VITE_SPEECH_SERVICE_URL || '/api/speech';
  // 用于保存后端录音的停止函数，避免与方法名冲突导致自调用
  private backendStopFn: (() => void) | null = null;

  constructor() {
    this.checkSupport();
    this.checkBackendAvailability();
  }

  private checkSupport() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.isSupported = true;
      this.setupRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
      this.isSupported = true;
      this.setupRecognition();
    } else {
      this.isSupported = false;
    }
  }

  private async checkBackendAvailability() {
    try {
  const response = await fetch(`${this.speechServiceUrl}/status`);
  const data = await response.json();
  this.isBackendAvailable = !!(data.configured || data.available);
    } catch (error) {
      console.warn('后端语音服务不可用:', error);
      this.isBackendAvailable = false;
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'zh-CN';
    this.recognition.maxAlternatives = 1;
  }

  public isBrowserSupported(): boolean {
    return this.isSupported;
  }

  public isServiceAvailable(): boolean {
    return this.isSupported || this.isBackendAvailable;
  }

  public startRecognition(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        // 如果浏览器不支持，尝试使用后端API
        this.startBackendRecognition().then(resolve).catch(reject);
        return;
      }

      let finalTranscript = '';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        finalTranscript = transcript;
      };

      this.recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        
        // 如果浏览器语音识别失败，尝试使用后端API
        if (this.isBackendAvailable) {
          message.warning('浏览器语音识别失败，尝试使用服务器识别');
          this.startBackendRecognition().then(resolve).catch(reject);
        } else {
          reject(new Error(`语音识别错误: ${event.error}`));
        }
      };

      this.recognition.onend = () => {
        if (finalTranscript) {
          resolve(finalTranscript);
        } else {
          reject(new Error('未识别到语音内容'));
        }
      };

      this.recognition.onnomatch = () => {
        reject(new Error('无法识别语音内容，请重试'));
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(new Error('启动语音识别失败'));
      }
    });
  }

  public stopRecognition() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // 使用后端API进行语音识别（备用方案）
  /**
   * 使用后端API进行语音识别（改进版）
   */
  private async startBackendRecognition(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!this.isBackendAvailable) {
        reject(new Error('语音识别服务不可用，请检查后端服务配置'));
        return;
      }

      let audio: HTMLAudioElement | null = null;

      try {
        // 检查麦克风权限
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        const mediaRecorder = new MediaRecorder(stream, { 
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 16000
        });
        
        const audioChunks: Blob[] = [];
        let recordingTimeout: NodeJS.Timeout;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          clearTimeout(recordingTimeout);
          try {
            if (audioChunks.length === 0) {
              throw new Error('未录制到音频数据');
            }

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
            
            // 检查音频时长（至少1秒）
            audio = new Audio();
            audio.src = URL.createObjectURL(audioBlob);
            
            await new Promise((resolve) => {
              audio!.onloadedmetadata = () => {
                if (audio!.duration < 1) {
                  throw new Error('录音时间太短，请至少录制1秒');
                }
                resolve(null);
              };
            });

            const transcript = await this.recognizeWithBackend(audioBlob);
            resolve(transcript);
          } catch (error) {
            reject(error);
          } finally {
            stream.getTracks().forEach(track => track.stop());
            if (audio) {
              URL.revokeObjectURL(audio.src);
            }
          }
        };

        mediaRecorder.onerror = (_event: ErrorEvent) => {
          clearTimeout(recordingTimeout);
          reject(new Error('录音设备错误'));
        };

        // 开始录制
        mediaRecorder.start(100); // 每100ms收集一次数据
        
        // 设置10秒自动停止
        recordingTimeout = setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 10000);

        // 暴露停止函数到独立属性，避免覆盖类方法或引发递归
        this.backendStopFn = () => {
          clearTimeout(recordingTimeout);
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        };

      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            reject(new Error('麦克风权限被拒绝，请允许网站访问麦克风'));
          } else if (error.name === 'NotFoundError') {
            reject(new Error('未找到可用的麦克风设备'));
          } else {
            reject(new Error(`无法访问麦克风: ${error.message}`));
          }
        } else {
          reject(new Error('未知错误'));
        }
      }
    });
  }

  public stopBackendRecording() {
    try {
      if (this.backendStopFn) {
        this.backendStopFn();
      }
    } finally {
      // 清除引用，防止内存泄漏或重复调用
      this.backendStopFn = null;
    }
  }

  public async recognizeWithBackend(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(`${this.speechServiceUrl}/recognize`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('语音识别失败');
      }

      const data = await response.json();
      
      if (data.success) {
        return data.transcript;
      } else {
        throw new Error(data.error || '语音识别失败');
      }
    } catch (error) {
      console.error('后端语音识别错误:', error);
      throw new Error('语音识别服务暂时不可用');
    }
  }

  // 获取语音识别状态
  public async getSpeechStatus() {
    return {
      browserSupported: this.isSupported,
      backendAvailable: this.isBackendAvailable,
      serviceAvailable: this.isServiceAvailable()
    };
  }
}

export default new SpeechService();