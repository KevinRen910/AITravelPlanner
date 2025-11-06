import React, { useState } from 'react';
import { Card, Button, Table, Input, Select, Form, InputNumber, Tag, Modal, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

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
  const [form] = Form.useForm();

  const showModal = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    if (expense) {
      form.setFieldsValue(expense);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingExpense) {
        // 更新支出
        setExpenses(expenses.map(item => item.id === editingExpense.id ? { ...values, id: editingExpense.id } : item));
      } else {
        // 添加新支出
        const newExpense: Expense = {
          ...values,
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0]
        };
        setExpenses([...expenses, newExpense]);
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter(item => item.id !== id));
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
          <Form.Item label="金额" name="amount" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入金额" />
          </Form.Item>
          
          <Form.Item label="类别" name="category" rules={[{ required: true }]}>
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
            <Input.TextArea placeholder="请输入支出描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BudgetManagementPage;