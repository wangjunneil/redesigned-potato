"use client";

import React, { useState, useEffect, useRef } from "react";
import { CameraOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Spin, message } from "antd";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { amapGet } from "@/lib/amap";
import { submitTimeline } from "@/lib/timelineSubmit";
import { saveDraft } from "@/lib/draftStore";
import "easymde/dist/easymde.min.css";
import "./QuickCapture.scss";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

const mdeOptions = {
  spellChecker: false,
  placeholder: "记下此刻...",
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
  minHeight: "120px",
  maxHeight: "300px",
  autofocus: false,
  hideIcons: ["side-by-side", "fullscreen"],
};

const QuickCapture = () => {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [geo, setGeo] = useState({});
  const [weather, setWeather] = useState({});
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        try {
          const res = await amapGet("/v3/geocode/regeo", {
            location: `${longitude},${latitude}`,
          });
          if (res?.info === "OK") {
            const c = res.regeocode.addressComponent;
            setGeo({
              longitude,
              latitude,
              adcode: c.adcode || "320100",
              city: c.city,
              district: c.district,
              street: c.township,
              formatted_address: res.regeocode.formatted_address,
            });
          }
        } catch (e) {
          console.warn("定位失败:", e);
        }
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (!geo?.adcode) return;
    (async () => {
      try {
        const res = await amapGet("/v3/weather/weatherInfo", {
          city: geo.adcode,
          extensions: "base",
        });
        if (res?.info === "OK" && res?.lives?.length > 0) {
          setWeather(res.lives[0]);
        }
      } catch (e) {
        console.warn("天气获取失败:", e);
      }
    })();
  }, [geo?.adcode]);

  const addFiles = (newFiles) => {
    const list = Array.from(newFiles);
    setFiles((prev) => [...prev, ...list]);
    setPreviews((prev) => [
      ...prev,
      ...list.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    ]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const target = prev[index];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (!content.trim() && files.length === 0) {
      message.warning("请先输入内容或添加照片");
      return;
    }
    setSaving(true);
    try {
      await submitTimeline({ content, files, geo, weather });
      message.success("保存成功");
      setContent("");
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
    } catch (e) {
      if (e.message === "UNAUTHORIZED") {
        await saveDraft({ content, files });
        message.info("请先点底部「进入 timeline」完成验证，内容已暂存");
      } else {
        message.error(e.message || "保存失败");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quick-capture">
      <h1 className="quick-capture-title">记下此刻</h1>

      <div className="markdown-editor-wrapper">
        <SimpleMDE
          value={content}
          onChange={(value) => setContent(value)}
          options={mdeOptions}
        />
      </div>

      <div className="quick-capture-actions">
        <Button icon={<CameraOutlined />} onClick={() => cameraInputRef.current?.click()}>
          拍照
        </Button>
        <Button icon={<PictureOutlined />} onClick={() => galleryInputRef.current?.click()}>
          从相册选
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {previews.length > 0 && (
        <div className="quick-capture-previews">
          {previews.map((p, i) => (
            <div key={`${p.name}-${i}`} className="quick-capture-preview">
              <img src={p.url} alt={p.name} />
              <span className="quick-capture-remove" onClick={() => removeFile(i)}>
                ×
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="quick-capture-footer">
        <Button
          type="primary"
          className="quick-capture-save"
          loading={saving}
          onClick={handleSave}
        >
          保存
        </Button>
        <Button className="quick-capture-enter" onClick={() => router.push("/timeline")}>
          进入 timeline
        </Button>
      </div>

      {saving && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Spin size="small" />
        </div>
      )}
    </div>
  );
};

export default QuickCapture;
