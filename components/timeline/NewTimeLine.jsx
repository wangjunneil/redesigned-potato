"use client";

import React, { useState, useEffect } from "react";
import { UploadOutlined } from "@ant-design/icons";
import {
  Drawer,
  Space,
  Button,
  Form,
  Row,
  Col,
  Upload,
  Spin,
  message,
} from "antd";
import dynamic from "next/dynamic";
import { currentDate, splitDate } from "../../utils";
import { createTimeLine } from "@/database/modules/TimeLineDataAction";
import { amapGet } from "@/lib/amap";
import "easymde/dist/easymde.min.css";
import "./NewTimeLine.scss";

// 动态导入 SimpleMDE 编辑器，避免 SSR 问题
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

const CREATOR = "wangjunneil@gmail.com";

const weekDays = [
  "周日",
  "周一",
  "周二",
  "周三",
  "周四",
  "周五",
  "周六",
];

const mdeOptions = {
  spellChecker: false,
  placeholder: "总有那么一瞬间，想说些什么...",
  status: false,
  toolbar: [
    "bold",
    "italic",
    "heading",
    "|",
    "quote",
    "unordered-list",
    "ordered-list",
    "|",
    "link",
    "image",
  ],
  minHeight: "60px",
  maxHeight: "150px",
  autofocus: false,
  hideIcons: ["side-by-side", "fullscreen"],
};

const NewTimeLine = (props) => {
  const { open, setOpen, onSuccess } = props;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState("");
  const [uploadToken, setUploadToken] = useState();
  const [uploadFileList, setUploadFileList] = useState([]);
  const [geo, setGeo] = useState({});
  const [markdownValue, setMarkdownValue] = useState("");

  // 获取当前日期信息
  const [year, month, day] = splitDate();
  const dayOfWeek = new Date(`${year}-${month}-${day}`).getDay();
  const dateInfo = { year, month, day, week: weekDays[dayOfWeek] };

  useEffect(() => {
    if (!open) return;

    // 获取地理位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const longitude = position.coords.longitude;
          const latitude = position.coords.latitude;

          (async () => {
            try {
              const res = await amapGet("/v3/geocode/regeo", {
                location: `${longitude},${latitude}`,
              });

              if (res?.info === "OK") {
                setGeo({
                  longitude: longitude,
                  latitude: latitude,
                  adcode: res.regeocode.addressComponent.adcode || "320100",
                  citycode: res.regeocode.addressComponent.citycode,
                  city: res.regeocode.addressComponent.city,
                  district: res.regeocode.addressComponent.district,
                  street: res.regeocode.addressComponent.township,
                  formatted_address: res.regeocode.formatted_address,
                });
              }
            } catch (error) {
              console.error("获取地理位置信息时出错:", error);
            }
          })();
        },
        (error) => {
          // 地理位置获取失败是正常情况，不需要特别处理
          console.warn("无法获取地理位置:", error.message);
        }
      );
    }

    // 获取上传 token
    (async () => {
      try {
        const response = await fetch("/api/qiniu", { cache: "no-cache" });
        if (response.ok) {
          const result = await response.json();
          if (result.status === "ok") {
            setUploadToken(result.token);
          }
        }
      } catch (error) {
        console.error("获取上传token时出错:", error);
      }
    })();
  }, [open]);

  const onClose = () => {
    form.resetFields();
    setOpen(false);
    setLoading(false);
    setTips(null);
    setUploadFileList([]);
    setMarkdownValue("");
  };

  const handleSubmit = async () => {
    try {
      setTips("保存中");
      setLoading(true);

      const values = await form.validateFields();

      let weatherData = {};

      if (geo?.adcode) {
        try {
          const weatherJson = await amapGet("/v3/weather/weatherInfo", {
            city: geo.adcode,
            extensions: "base",
          });

          if (weatherJson?.info === "OK" && weatherJson?.lives?.length > 0) {
            weatherData = weatherJson.lives[0];
          }
        } catch (error) {
          console.error("获取天气信息时出错:", error);
        }
      }

      const data = {
        year: dateInfo.year,
        month: dateInfo.month,
        day: dateInfo.day,
        week: dateInfo.week,
        weather: weatherData,
        content: values.content,
        photos: values.photos || [],
        creator: CREATOR,
        extends: {
          geo: geo || {},
        },
      };

      await createTimeLine(data);
      message.success("保存成功");
      onClose();

      // 通知父组件刷新数据
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (error.errorFields) {
        message.error("请填写必填项");
      } else {
        console.error("保存失败:", error);
        message.error("保存失败，请重试");
      }
      setTips(null);
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    if (!uploadToken) {
      message.warning("上传服务初始化中，请稍后再试");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const deleteUploadFile = (file) => {
    setTips("删除中");
    setLoading(true);

    const key = file.response.key;
    fetch("/api/qiniu", {
      method: "POST",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
      .then((res) => {
        if (!res.ok) {
          console.error("删除文件失败:", res.status);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("删除文件时出错:", error);
        setLoading(false);
      });
  };

  const handleUploadChange = (info) => {
    if (info.file.status === "error") {
      console.log(info.file.response?.error);
    }

    if (info.file.status === "done") {
      const imageKey = info.file.response.key;
      console.log("imageKey", imageKey);

      setUploadFileList(info.fileList);
      console.log("fileList", info.fileList);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  return (
    <Drawer
      title="瞬时心情"
      className="timeline-drawer"
      placement={"bottom"}
      height="50vh"
      closable={false}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            onClick={handleSubmit}
            className="timeline-btn-save"
            type="primary"
            htmlType="submit"
          >
            保存
          </Button>
        </Space>
      }
    >
      <Spin tip={tips} size="large" spinning={loading}>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="content"
                rules={[
                  {
                    required: true,
                    message: "请输入内容",
                  },
                ]}
              >
                <div className="markdown-editor-wrapper">
                  <SimpleMDE
                    value={markdownValue}
                    onChange={(value) => {
                      setMarkdownValue(value);
                      form.setFieldsValue({ content: value });
                    }}
                    options={mdeOptions}
                  />
                </div>
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
                  multiple={false}
                  accept=".png, .jpg, .jpeg, .mp4, .webp"
                  data={(file) => ({
                    token: uploadToken,
                    key: `wangjundev/timeline/${currentDate()}/${file.name}`,
                  })}
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  action="https://upload.qiniup.com"
                  listType="picture"
                  fileList={uploadFileList}
                  onRemove={deleteUploadFile}
                >
                  <Button icon={<UploadOutlined />}>上传</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default NewTimeLine;
