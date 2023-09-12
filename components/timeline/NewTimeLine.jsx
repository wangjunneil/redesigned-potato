import React, { useState, useEffect } from "react";
import { UploadOutlined } from "@ant-design/icons";
import {
  Drawer,
  Space,
  Button,
  Form,
  Row,
  Col,
  Input,
  Upload,
  Spin,
} from "antd";
import { currentDate, splitDate } from "../../utils";
import { createTimeLine } from "@/database/modules/TimeLineDataAction";
import { getSecretValue } from "@/services";

const [year, month, day] = splitDate();
const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const dayOfWeek = new Date(`${year}-${month}-${day}`).getDay();

const NewTimeLine = (props) => {
  const { open, setOpen } = props;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [uploadToken, setUploadToken] = useState();
  const [fileKey, setFileKey] = useState();
  const [uploadFileList, setUploadFileList] = useState([]);

  const [geo, setGeo] = useState({});
  const [weather, setWeather] = useState({});

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const longitude = position.coords.longitude;
          const latitude = position.coords.latitude;

          (async () => {
            const AMAP_KEY = "3e33b6ce0066e396d97bca3cb96a6693"; //await getSecretValue("AMAP_KEY");

            // 查询地理位置信息
            const response = await fetch(
              `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${AMAP_KEY}`,
              { cache: "force-cache" }
            );
            const res = await response.json();
            if (res?.info === "OK") {
              setGeo({
                longitude: longitude,
                latitude: latitude,
                adcode: res.regeocode.addressComponent.adcode,
                citycode: res.regeocode.addressComponent.citycode,
                city: res.regeocode.addressComponent.city,
                district: res.regeocode.addressComponent.district,
                street: res.regeocode.addressComponent.township,
                formatted_address: res.regeocode.formatted_address,
              });
            }
          })();
        },
        (error) => {
          console.error("获取位置信息时出现错误：", error);
        }
      );
    } else {
      console.error("浏览器不支持地理位置获取");
    }

    (async () => {
      const response = await fetch("/qiniu", { cache: "no-cache" });
      const result = await response.json();
      if (result.status === "ok") {
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
      console.log("geo", geo);

      if (geo?.adcode) {
        const AMAP_KEY = "3e33b6ce0066e396d97bca3cb96a6693";
        // 查询位置天气信息
        const weatherResponse = await fetch(
          `https://restapi.amap.com/v3/weather/weatherInfo?city=${geo.adcode}&key=${AMAP_KEY}`,
          { cache: "force-cache" }
        );
        console.log("weatherResponse", weatherResponse);
        const weatherJson = await weatherResponse.json();
        console.log("weatherJson", weatherJson);
        if (weatherJson?.info === "OK") {
          const data = {
            year: year,
            month: month,
            day: day,
            week: weekDays[dayOfWeek],
            weather: weatherJson?.lives.length == 0 ? {} : weatherJson.lives[0],
            content: values.content,
            photos: values.photos,
            creator: "wangjunneil@gmail.com",
            video: "",
            tags: "",
            extends: {
              geo: geo,
            },
          };

          const res = await createTimeLine(data);
          console.log("createTimeLine", res);

          onClose();
        }
      }
    });
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
      size="large"
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
      <Spin tip="保存中" size="large" spinning={loading}>
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
                <Input.TextArea
                  bordered="true"
                  rows={6}
                  placeholder="总有那么一瞬间，想说些什么"
                />
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
                  multiple={true}
                  // accept=".png, .jpg, .jpeg"
                  data={() => getUploadToken()}
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  action="https://up-z0.qiniup.com"
                  listType="picture"
                  fileList={uploadFileList}
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