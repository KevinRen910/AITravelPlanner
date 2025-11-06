import { userAPI } from './apiService';
import { message } from 'antd';

class SpeechService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isBackendAvailable: boolean = false;

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
      const response = await fetch('/api/speech/status');
      const data = await response.json();
      this.isBackendAvailable = data.configured;
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
  private async startBackendRecognition(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!this.isBackendAvailable) {
        reject(new Error('语音识别服务不可用'));
        return;
      }

      try {
        // 使用浏览器的MediaRecorder录制音频
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const transcript = await this.recognizeWithBackend(audioBlob);
            resolve(transcript);
          } catch (error) {
            reject(error);
          } finally {
            stream.getTracks().forEach(track => track.stop());
          }
        };

        // 开始录制
        mediaRecorder.start();
        
        // 5秒后自动停止（或用户可以手动停止）
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 5000);

        // 返回一个可以手动停止的函数
        const stopRecording = () => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        };

        // 将停止函数暴露给外部
        (this as any).stopBackendRecording = stopRecording;

      } catch (error) {
        reject(new Error('无法访问麦克风'));
      }
    });
  }

  public stopBackendRecording() {
    if ((this as any).stopBackendRecording) {
      (this as any).stopBackendRecording();
    }
  }

  public async recognizeWithBackend(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/speech/recognize', {
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