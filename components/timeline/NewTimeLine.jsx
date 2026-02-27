import React, { useState, useEffect, useMemo } from "react";
import { UploadOutlined } from "@ant-design/icons";
import MD5 from "crypto-js/md5";
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
import "easymde/dist/easymde.min.css";
import "./NewTimeLine.scss";

// 动态导入 SimpleMDE 编辑器，避免 SSR 问题
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const NewTimeLine = (props) => {
  const { open, setOpen, onSuccess } = props;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState("");
  const [uploadToken, setUploadToken] = useState();
  const [fileKey, setFileKey] = useState();
  const [uploadFileList, setUploadFileList] = useState([]);
  const [geo, setGeo] = useState({});
  const [markdownValue, setMarkdownValue] = useState("");

  const AMAP_ACCESS_KEY = process.env.NEXT_PUBLIC_AMAP_ACCESS_KEY;
  const AMAP_PRIVATE_KEY = process.env.NEXT_PUBLIC_AMAP_PRIVATE_KEY;

  // 获取当前日期信息
  const dateInfo = useMemo(() => {
    const [year, month, day] = splitDate();
    const dayOfWeek = new Date(`${year}-${month}-${day}`).getDay();
    return { year, month, day, week: weekDays[dayOfWeek] };
  }, []);

  // 配置 SimpleMDE 编辑器选项
  const mdeOptions = useMemo(() => {
    return {
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
        "|",
        "preview",
        "guide",
      ],
      minHeight: "120px",
      maxHeight: "300px",
      autofocus: false,
      hideIcons: ["side-by-side", "fullscreen"],
    };
  }, []);

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
              const sig = MD5(
                `key=${AMAP_ACCESS_KEY}&location=${longitude},${latitude}${AMAP_PRIVATE_KEY}`
              );

              const response = await fetch(
                `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_ACCESS_KEY}&location=${longitude},${latitude}&sig=${sig}`,
                { cache: "force-cache" }
              );

              if (response.ok) {
                const res = await response.json();
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
        const response = await fetch("/qiniu", { cache: "no-cache" });
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
  }, [open, AMAP_ACCESS_KEY, AMAP_PRIVATE_KEY]);

  const onClose = () => {
    form.resetFields();
    setOpen(false);
    setLoading(false);
    setFileKey();
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
          const sig = MD5(
            `city=${geo.adcode}&key=${AMAP_ACCESS_KEY}${AMAP_PRIVATE_KEY}`
          );

          const weatherResponse = await fetch(
            `https://restapi.amap.com/v3/weather/weatherInfo?city=${geo.adcode}&key=${AMAP_ACCESS_KEY}&sig=${sig}`,
            { cache: "force-cache" }
          );

          if (weatherResponse.ok) {
            const weatherJson = await weatherResponse.json();
            if (weatherJson?.info === "OK" && weatherJson?.lives?.length > 0) {
              weatherData = weatherJson.lives[0];
            }
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
        creator: "wangjunneil@gmail.com",
        video: "",
        tags: "",
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

  const getUploadToken = () => {
    return {
      token: uploadToken,
      key: fileKey,
    };
  };

  const beforeUpload = (file) => {
    setFileKey(`wangjundev/timeline/${currentDate()}/${file.name}`);
    return true;
  };

  const deleteUploadFile = (file) => {
    setTips("删除中");
    setLoading(true);

    const key = file.response.key;
    fetch("/qiniu", {
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
      placement={"bottom"}
      closable={false}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            onClick={handleSubmit}
            style={{ backgroundColor: "#1677ff" }}
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
                  data={() => getUploadToken()}
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  action="https://up-z0.qiniup.com"
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
