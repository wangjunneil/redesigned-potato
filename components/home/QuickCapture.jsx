"use client";

import React, { useState, useEffect, useRef } from "react";
import { CameraOutlined, PictureOutlined, AudioOutlined } from "@ant-design/icons";
import { Button, message } from "antd";
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

// 频谱柱数量：JSX 渲染与采样逻辑共用，避免对不上
const WAVE_BAR_COUNT = 26;

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
  // 声纹波纹相关
  const micBarsRef = useRef([]);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);

  // iOS 检测：iOS 上 getUserMedia 与语音识别共用麦克风会冲突，
  // 因此 iOS 跳过真实采集，改用 CSS 假频谱动画
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent);

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

  // 清空：只清录入的文字和照片，天气 / 定位保留
  const handleClear = () => {
    setContent("");
    setFiles([]);
    previews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setPreviews([]);
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
    // 每次录制都新建识别实例，避免复用同一实例导致二次录制失效
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
      stopWaveform();
    };
    recognitionRef.current = recognition;
    recordingRef.current = true;
    setRecording(true);
    try {
      recognition.start();
      startWaveform();
    } catch (e) {
      console.warn("语音识别启动失败:", e);
      stopWaveform();
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
    stopWaveform();
  };

  // —— 声纹波纹：AudioContext + AnalyserNode + rAF，ref 直写 DOM ——
  const startWaveform = async () => {
    if (isIOS) return; // iOS：跳过真实采集，避免与语音识别抢麦克风（用 CSS 假频谱）
    try {
      if (!navigator.mediaDevices?.getUserMedia) return; // 无能力则静默跳过
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512; // 频段更细，频谱更平滑
      analyser.smoothingTimeConstant = 0.8; // 起伏平滑
      source.connect(analyser);
      streamRef.current = stream;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      startWaveformLoop();
    } catch (e) {
      // 静默降级：权限被拒 / iOS 等，不打断语音识别
      console.warn("声纹波纹不可用:", e);
    }
  };

  const startWaveformLoop = () => {
    const analyser = analyserRef.current;
    const bars = micBarsRef.current;
    if (!analyser || bars.length === 0) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const n = bars.length;
    const tick = () => {
      const a = analyserRef.current;
      const bs = micBarsRef.current;
      if (!a || bs.length === 0) return;
      a.getByteFrequencyData(dataArray);
      const len = dataArray.length;
      // 对数间隔采样：低中频更密集，像真实频谱
      // 每根柱子映射一个频段，直接写 style.transform，不触发重渲染
      for (let i = 0; i < bs.length; i++) {
        const t = i / (n - 1);
        const idx = Math.floor(Math.pow(t, 1.5) * (len - 1));
        const v = dataArray[idx] / 255;
        const scale = Math.max(0.08, Math.min(1, v));
        const el = bs[i];
        if (el) el.style.transform = `scaleY(${scale.toFixed(3)})`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopWaveform = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    micBarsRef.current.forEach((el) => {
      if (el) el.style.transform = "scaleY(0.08)"; // 柱子复位到静默小柱
    });
  };

  const handleMicPressStart = (e) => {
    if (e.type === "touchstart") {
      // 阻止合成 mouse 事件与长按菜单
      e.preventDefault();
    }
    // AI 润色中：不启动录音
    if (aiLoading) return;
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

  // 组件卸载：清理声纹波纹
  useEffect(() => {
    return () => {
      stopWaveform();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="quick-capture">
      <h1 className="quick-capture-title">记下此刻</h1>

      <div className="quick-capture-actions">
        <Button icon={<CameraOutlined />} disabled={aiLoading} onClick={() => cameraInputRef.current?.click()}>
          拍照
        </Button>
        <Button icon={<PictureOutlined />} disabled={aiLoading} onClick={() => galleryInputRef.current?.click()}>
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
          <div className={`quick-capture-wave${recording ? " is-active" : ""}${isIOS ? " is-fake" : ""}`}>
            {[...Array(WAVE_BAR_COUNT)].map((_, i) => (
              <span
                key={i}
                ref={(el) => {
                  micBarsRef.current[i] = el;
                }}
                className="quick-capture-wave-bar"
              />
            ))}
          </div>
          <div
            className={`quick-capture-mic${recording ? " is-recording" : ""}${aiLoading ? " is-disabled" : ""}`}
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

      <button className="quick-capture-switch" disabled={aiLoading} onClick={() => setInputMode((m) => (m === "voice" ? "text" : "voice"))}>
        {inputMode === "voice" ? "切换到文本输入" : "切换到语音输入"}
      </button>

      {(content.trim() || files.length > 0) && (
        <button className="quick-capture-clear" onClick={handleClear}>
          清空
        </button>
      )}

      <div className="quick-capture-footer">
        <div className="quick-capture-save-row">
          <Button className="quick-capture-refine" disabled={aiLoading || saving} onClick={handleRefine}>
            AI
            {aiLoading && <span className="quick-capture-progress" />}
          </Button>
          <Button
            type="primary"
            className="quick-capture-save"
            disabled={saving || aiLoading}
            onClick={handleSave}
          >
            保存
            {saving && <span className="quick-capture-progress" />}
          </Button>
        </div>
        <Button className="quick-capture-enter" disabled={aiLoading} onClick={() => router.push("/timeline")}>
          进入 timeline
        </Button>
      </div>
    </div>
  );
};

export default QuickCapture;
