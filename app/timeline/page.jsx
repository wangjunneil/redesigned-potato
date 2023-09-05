'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { Timeline, Divider, FloatButton, Drawer, Space, Button, Form, Row, Col, Input, Upload } from 'antd';
import './page.scss';
import NodeLabel from '@/components/timeline/NodeLabel';
import NodeChild from '@/components/timeline/NodeChild';

const timeLineData = [
    {date: '2015/09/01', week: 'Wed.', content: '下拉😠选择器通常包含选择器及下拉框，下拉框展示选项列表，提供单选或者多选的能力。选定的选项可以作为表单中的字段值。'},
    {date: '2015/09/05', week: 'Tues.', content: '下拉选择器用于🏓表单或页面区域的信息筛查选择，同时用于替代系统原生 select，在限定的可选项内进行快速选择，核心能力是选择。'},
    {date: '2015/09/07', week: 'Sat.', content: '标签上的文字应该简洁、无歧义并能准确描述出它所对应的内容区的信息特征。'},
    {date: '2015/09/21', week: 'Mon.', content: "# Hello, **React**! [百度](https://www.baidu.com) <mark>这还是高亮文本</mark> ==tag== https://www.jaskan.com, ~~删除线~~ O<sup>2</sup>"},
];

const TimeLinePage = () => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    
  }, []);

  const onClose = () => {
    form.resetFields();
    setOpen(false);
  };

  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      console.log('values', values);
    })
  }

  return (
    <div className="w-3/5 my-24 mx-auto">
        <h1 className="text-center font-500 text-2xl">
            Life Time Line            
            <span className="text-xs pl-3 text-zinc-400">2023.09.01 develop</span>
        </h1>
        <Divider orientation="left" plain></Divider>
        <Timeline mode='left'
        items={timeLineData.map(item => {
            return {label: <NodeLabel nodeData={item}/>, color: 'gray', children: <NodeChild nodeData={item}/>}
        })}
        />

      <FloatButton.BackTop />
      <FloatButton onClick={() => setOpen(true)} icon={<PlusOutlined />}/>

      <Drawer
        title="心情一刻"
        placement={'bottom'}
        closable={false}
        onClose={onClose}
        open={open}
        extra={
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button onClick={handleSubmit} style={{backgroundColor: '#1677ff'}} type="primary" htmlType="submit">
              提交
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="content"
                // label="文本内容"
                rules={[
                  {
                    required: true,
                    message: '请输入内容',
                  },
                ]}
              >
                <Input.TextArea bordered='true' rows={4} placeholder="请输入内容" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                  name="photos"
                  // label="图片地址"
                >
              
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  )
}

export default TimeLinePage