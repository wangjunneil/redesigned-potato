import React, { useState, useEffect } from 'react'
import { UploadOutlined } from '@ant-design/icons';
import { Drawer, Space, Button, Form, Row, Col, Input, Upload, Spin } from 'antd';
import { currentDate } from '../../utils';
import { createTimeLine } from '@/database/modules/TimeLineDataAction';

const NewTimeLine = (props) => {
    const { open, setOpen } = props;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false)
    const [uploadToken, setUploadToken] = useState();
    const [fileKey, setFileKey] = useState();
    const [uploadFileList, setUploadFileList] = useState([])

    useEffect(() => {
        (async ()=> {
          const response = await fetch('/qiniu', {cache:'no-cache'});
          const result = await response.json();
          if (result.status === 'ok') {
            setUploadToken(result.token);        
          }          
        })();    
    }, []);

    const onClose = () => {
        form.resetFields();
        setOpen(false);
        setLoading(false);
        setFileKey();
        setUploadFileList([]);
    };

    const handleSubmit = () => {
      setLoading(true);
      form.validateFields().then(async (values) => {
        const res = await createTimeLine(values)
        console.log('createTimeLine', res);

        onClose();
      })
    }

    const getUploadToken = () => {
        return {
          token : uploadToken,
          key : fileKey
        }
    }
    
    const beforeUpload = (file) => {
        setFileKey(`wangjundev/timeline/${currentDate()}/${file.name}`);
        return true;
    }

    const handleUploadChange = (info) => {
        if (info.file.status === 'error') {
            console.log(info.file.response?.error);
        }

        if (info.file.status === 'done') {
            const imageKey = info.file.response.key;
            console.log('imageKey', imageKey);

            setUploadFileList(info.fileList);

            console.log('fileList', info.fileList);
        }    
    }
    
    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e && e.fileList;
    };

    return (      
    <Drawer title="心情一刻" placement={'bottom'} closable={false} onClose={onClose} open={open}
        extra={
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button onClick={handleSubmit} style={{backgroundColor: '#1677ff'}} type="primary" htmlType="submit">
              提交
            </Button>
          </Space>
        }
        >
          <Spin tip="保存中" size="large" spinning={loading}>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="content"
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
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                >
                <Upload
                  name="file"
                  accept='.png, .jpg, .jpeg'
                  data={() => getUploadToken()}
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  action="https://up-z0.qiniup.com"                
                  listType="picture"
                  fileList={uploadFileList}
                >
                  <Button icon={<UploadOutlined />}>上传图片</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        </Spin>
    </Drawer>
  )
}

export default NewTimeLine