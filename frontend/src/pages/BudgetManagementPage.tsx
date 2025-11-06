import React, { useState, useRef } from 'react';
import { Card, Button, Table, Input, Select, Form, InputNumber, Tag, Modal, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AudioOutlined, StopOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { budgetAPI } from '../services/apiService';
import speechService from '../services/speechService';
import { addExpense as addExpenseAction, updateExpense as updateExpenseAction, deleteExpense as deleteExpenseAction } from '../store/features/budgetSlice';

const { Option } = Select;
const { TextArea } = Input;

// 模拟支出数据
interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

const BudgetManagementPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [recording, setRecording] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  // 开始录音
  const startRecording = async () => {
    if (!speechService.isBrowserSupported()) {
      message.error('您的浏览器不支持语音识别功能');
      return;
    }

    setRecording(true);
    try {
      const transcript = await speechService.startRecognition();
      // 解析语音识别结果，提取金额、类别和描述
      const parsedData = parseExpenseFromSpeech(transcript);
      
      if (parsedData) {
        form.setFieldsValue(parsedData);
        message.success('语音识别完成');
      } else {
        message.warning('无法从语音中提取支出信息，请手动输入');
        form.setFieldsValue({ description: transcript });
      }
    } catch (error: any) {
      message.error(error.message || '语音识别失败');
    } finally {
      setRecording(false);
    }
  };

  // 停止录音
  const stopRecording = () => {
    speechService.stopRecording();
    setRecording(false);
  };

  // 从语音中解析支出信息
  const parseExpenseFromSpeech = (transcript: string) => {
    // 简单的解析逻辑，实际应用中可能需要更复杂的NLP处理
    const amountMatch = transcript.match(/(\d+\.?\d*)\s*元/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    
    // 尝试匹配类别
    let category = '其他';
    if (transcript.includes('交通') || transcript.includes('打车') || transcript.includes('地铁') || transcript.includes('公交')) {
      category = '交通';
    } else if (transcript.includes('吃饭') || transcript.includes('餐饮') || transcript.includes('午餐') || transcript.includes('晚餐')) {
      category = '餐饮';
    } else if (transcript.includes('酒店') || transcript.includes('住宿')) {
      category = '住宿';
    } else if (transcript.includes('门票') || transcript.includes('景点')) {
      category = '景点门票';
    } else if (transcript.includes('购物') || transcript.includes('买')) {
      category = '购物';
    }
    
    if (amount) {
      return {
        amount,
        category,
        description: transcript
      };
    }
    
    return null;
  };

  const showModal = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    if (expense) {
      form.setFieldsValue(expense);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingExpense) {
        // 更新支出
        const response = await budgetAPI.updateExpense(editingExpense.id, values);
        const updatedExpense = response.data;
        
        // 更新本地状态
        setExpenses(expenses.map(item => item.id === editingExpense.id ? updatedExpense : item));
        
        // 更新Redux状态
        dispatch(updateExpenseAction(updatedExpense));
        
        message.success('支出更新成功');
      } else {
        // 添加新支出
        const newExpenseData = {
          ...values,
          date: values.date || new Date().toISOString().split('T')[0]
        };
        
        // 这里应该关联到某个预算，简化处理，直接添加
        const response = await budgetAPI.addExpense('default-budget-id', newExpenseData);
        const newExpense = response.data;
        
        setExpenses([...expenses, newExpense]);
        
        // 更新Redux状态
        dispatch(addExpenseAction(newExpense));
        
        message.success('支出添加成功');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await budgetAPI.deleteExpense(id);
      
      setExpenses(expenses.filter(item => item.id !== id));
      
      // 更新Redux状态
      dispatch(deleteExpenseAction(id));
      
      message.success('支出删除成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  // 修改Table列定义中的render函数，添加正确的类型
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        let color = '';
        switch(category) {
          case '交通': color = 'blue'; break;
          case '住宿': color = 'purple'; break;
          case '餐饮': color = 'green'; break;
          case '景点门票': color = 'orange'; break;
          case '购物': color = 'red'; break;
          default: color = 'gray';
        }
        return <Tag color={color}>{category}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Expense) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => showModal(record)}>
            编辑
          </Button>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 计算总支出
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>预算管理</h1>
      
      <Card title={`总支出: ¥${totalAmount.toFixed(2)}`} extra={<Button type="primary" onClick={() => showModal()} icon={<PlusOutlined />}>添加支出</Button>}>
        <Table columns={columns} dataSource={expenses} rowKey="id" />
      </Card>
      
      <Modal
        title={editingExpense ? "编辑支出" : "添加支出"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入金额" />
          </Form.Item>
          
          <Form.Item label="类别" name="category" rules={[{ required: true, message: '请选择支出类别' }]}>
            <Select placeholder="选择支出类别">
              <Option value="交通">交通</Option>
              <Option value="住宿">住宿</Option>
              <Option value="餐饮">餐饮</Option>
              <Option value="景点门票">景点门票</Option>
              <Option value="购物">购物</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="描述" name="description">
            <TextArea 
              rows={4} 
              placeholder="请输入支出描述，或使用语音输入" 
              suffix={
                <Button
                  type="text"
                  icon={recording ? <StopOutlined /> : <AudioOutlined />}
                  onClick={recording ? stopRecording : startRecording}
                  style={{ color: recording ? '#ff4d4f' : '#1890ff' }}
                >
                  {recording ? '停止录音' : '语音输入'}
                </Button>
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BudgetManagementPage;