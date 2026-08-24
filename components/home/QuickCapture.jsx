"use client";

import React, { useState, useEffect, useRef } from "react";
import { CameraOutlined, PictureOutlined, AudioOutlined } from "@ant-design/icons";
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
  const [aiLoading, setAiLoading] = useState(false);
  const [inputMode, setInputMode] = useState("voice"); // "voice" | "text"
  const [recording, setRecording] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const previewsRef = useRef([]);
  const recognitionRef = useRef(null);
  const recordingRef = useRef(false);

  const fetchGeoAndWeather = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ geo: {}, weather: {} });
      let settled = false;
      const finish = (geo, weather) => {
        if (settled) return;
        settled = true;
        resolve({ geo, weather });
      };
      const timer = setTimeout(() => finish({}, {}), 4000);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const longitude = position.coords.longitude;
          const latitude = position.coords.latitude;
          let geo = {};
          let weather = {};
          try {
            const res = await amapGet("/v3/geocode/regeo", {
              location: `${longitude},${latitude}`,
            });
            if (res?.info === "OK") {
              const c = res.regeocode.addressComponent;
              geo = {
                longitude,
                latitude,
                adcode: c.adcode || "320100",
                city: c.city,
                district: c.district,
                street: c.township,
                formatted_address: res.regeocode.formatted_address,
              };
              try {
                const wres = await amapGet("/v3/weather/weatherInfo", {
                  city: geo.adcode,
                  extensions: "base",
                });
                if (wres?.info === "OK" && wres?.lives?.length > 0) {
                  weather = wres.lives[0];
                }
              } catch (e) {
                console.warn("天气获取失败:", e);
              }
            }
          } catch (e) {
            console.warn("定位失败:", e);
          }
          clearTimeout(timer);
          finish(geo, weather);
        },
        () => {
          clearTimeout(timer);
          finish({}, {});
        }
      );
    });

  useEffect(() => {
    (async () => {
      const { geo: g, weather: w } = await fetchGeoAndWeather();
      if (Object.keys(g).length) setGeo(g);
      if (Object.keys(w).length) setWeather(w);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (newFiles) => {
    const list = Array.from(newFiles);
    setFiles((prev) => [...prev, ...list]);
    setPreviews((prev) => [
      ...prev,
      ...list.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
        isVideo: f.type.startsWith("video/"),
      })),
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

  const getSpeechRecognition = () =>
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const startRecording = () => {
    if (recordingRef.current) return;
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      message.warning("当前浏览器不支持语音识别");
      return;
    }
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = "zh-CN";
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res?.[0]?.transcript) transcript += res[0].transcript;
        }
        if (transcript) {
          setContent((prev) => (prev ? `${prev}\n${transcript}` : transcript));
        }
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed") {
          message.error("请允许麦克风权限");
        } else if (event.error === "no-speech" || event.error === "aborted") {
          // 无语音 / 主动停止：静默
        } else if (
          event.error === "service-not-allowed" ||
          event.error === "audio-capture"
        ) {
          message.warning("当前设备无可用语音引擎，已切换到文本输入");
          setInputMode("text");
        } else {
          message.error("语音识别出错，请重试");
        }
      };
      recognition.onend = () => {
        setRecording(false);
        recordingRef.current = false;
      };
      recognitionRef.current = recognition;
    }
    recordingRef.current = true;
    setRecording(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("语音识别启动失败:", e);
      recordingRef.current = false;
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recordingRef.current) return;
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      console.warn("语音识别停止失败:", e);
      setRecording(false);
      recordingRef.current = false;
    }
  };

  const handleMicPressStart = (e) => {
    if (e.type === "touchstart") {
      // 阻止合成 mouse 事件与长按菜单
      e.preventDefault();
    }
    startRecording();
  };

  const handleMicPressEnd = () => {
    stopRecording();
  };

  const handleSave = async () => {
    if (!content.trim()) {
      message.warning("请输入内容");
      return;
    }
    setSaving(true);
    let finalGeo = geo;
    let finalWeather = weather;
    try {
      // 若天气还没拿到，保存前再兜底拉一次定位/天气（避免保存太快导致天气为空）
      if (!finalWeather?.weather || !finalWeather?.temperature) {
        const { geo: g, weather: w } = await fetchGeoAndWeather();
        if (Object.keys(g).length) finalGeo = g;
        if (Object.keys(w).length) finalWeather = w;
      }
      await submitTimeline({ content, files, geo: finalGeo, weather: finalWeather });
      message.success("保存成功");
      setContent("");
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
    } catch (e) {
      try {
        await saveDraft({ content, files, geo: finalGeo, weather: finalWeather });
        if (e.message === "UNAUTHORIZED") {
          message.info("请先点底部「进入 timeline」完成验证，内容已暂存");
        } else {
          message.error("保存失败，内容已暂存，可稍后重试");
        }
      } catch (saveErr) {
        console.error("暂存失败:", saveErr);
        message.error("保存失败且暂存失败，请勿离开页面");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRefine = async () => {
    if (!content.trim()) {
      message.warning("请先输入内容");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.status === 401) {
        message.info("请先点底部「进入 timeline」完成验证");
        return;
      }
      if (!res.ok) {
        let errMsg = "AI 润色失败";
        try {
          const data = await res.json();
          if (data?.error) errMsg = data.error;
        } catch (e) {
          // 响应体不是 JSON，用默认提示
        }
        message.error(errMsg);
        return;
      }
      const data = await res.json();
      if (data?.content) {
        setContent(data.content);
        message.success("润色完成");
      } else {
        message.error("AI 润色失败");
      }
    } catch (e) {
      message.error("AI 润色失败");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    };
  }, []);

  return (
    <div className="quick-capture">
      <h1 className="quick-capture-title">记下此刻</h1>

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
          accept="image/*,video/*"
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
          accept="image/*,video/*"
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
              {p.isVideo ? (
                <video src={p.url} muted playsInline />
              ) : (
                <img src={p.url} alt={p.name} />
              )}
              <span className="quick-capture-remove" onClick={() => removeFile(i)}>
                ×
              </span>
            </div>
          ))}
        </div>
      )}

      {inputMode === "voice" ? (
        <div className="quick-capture-voice">
          <div
            className={`quick-capture-mic${recording ? " is-recording" : ""}`}
            role="button"
            onMouseDown={handleMicPressStart}
            onTouchStart={handleMicPressStart}
            onMouseUp={handleMicPressEnd}
            onTouchEnd={handleMicPressEnd}
            onMouseLeave={handleMicPressEnd}
            onTouchCancel={handleMicPressEnd}
          >
            <AudioOutlined />
          </div>
          <div
            className={`quick-capture-mic-hint${recording ? " is-recording" : ""}`}
          >
            {recording ? "松开结束" : "按住说话"}
          </div>
          <div className="quick-capture-voice-content">
            {content ? (
              <div className="quick-capture-voice-text">{content}</div>
            ) : (
              <div className="quick-capture-voice-placeholder">
                按住说话，松开后自动转成文字
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="markdown-editor-wrapper">
          <SimpleMDE
            value={content}
            onChange={(value) => setContent(value)}
            options={mdeOptions}
          />
        </div>
      )}

      <button className="quick-capture-switch" onClick={() => setInputMode((m) => (m === "voice" ? "text" : "voice"))}>
        {inputMode === "voice" ? "切换到文本输入" : "切换到语音输入"}
      </button>

      <div className="quick-capture-footer">
        <div className="quick-capture-save-row">
          <Button className="quick-capture-refine" loading={aiLoading} onClick={handleRefine}>
            AI
          </Button>
          <Button
            type="primary"
            className="quick-capture-save"
            loading={saving}
            onClick={handleSave}
          >
            保存
          </Button>
        </div>
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
