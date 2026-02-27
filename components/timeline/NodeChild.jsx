import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { DeleteOutlined } from "@ant-design/icons";
import { Row, Col, Button, Image, Spin, message } from "antd";
import gfm from "remark-gfm";
import { deleteTimeLine } from "@/database/modules/TimeLineDataAction";

const NodeChild = (props) => {
  const { timeLine, isDelete, setIsDelete, setLoading } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState("");
  const containerRef = useRef(null);

  // 懒加载逻辑
  useEffect(() => {
    const currentRef = containerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.01,
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const removeTimeLine = async (id) => {
    try {
      setLoading(true);
      await deleteTimeLine({ _id: id });
      setIsDelete(false);
      message.success("删除成功");
    } catch (error) {
      console.error("删除失败:", error);
      message.error("删除失败，请重试");
      setLoading(false);
    }
  };

  const handleVideoClick = (src) => {
    setCurrentVideoSrc(src);
    setPreviewVisible(true);
  };

  // 安全获取照片数组
  const photos = timeLine.photos || [];
  const videos = photos.filter((item) => item.src?.endsWith("mp4") || item.src?.endsWith("mov"));
  const images = photos.filter((item) => !item.src?.endsWith("mp4") && !item.src?.endsWith("mov"));

  return (
    <div ref={containerRef}>
      <Row gutter={16}>
        <Col span={isDelete ? 20 : 24}>
          <ReactMarkdown remarkPlugins={[gfm]}>
            {timeLine.content}
          </ReactMarkdown>
        </Col>
        {isDelete && (
          <Col span={4}>
            <Button
              shape="circle"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeTimeLine(timeLine._id)}
            />
          </Col>
        )}
      </Row>

      {!isVisible ? (
        <div style={{ minHeight: "60px", display: "flex", alignItems: "center" }}>
          <Spin size="small" />
        </div>
      ) : (
        <>
          {(videos.length > 0 || images.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {/* 视频缩略图 */}
              {videos.map((item, index) => (
                <div
                  key={`video-${timeLine._id}-${index}`}
                  style={{
                    position: "relative",
                    width: "50px",
                    height: "50px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                  onClick={() => handleVideoClick(item.src)}
                >
                  <video
                    src={item.src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    preload="metadata"
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "12px solid white",
                        borderTop: "8px solid transparent",
                        borderBottom: "8px solid transparent",
                        marginLeft: "3px",
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* 图片 */}
              <Image.PreviewGroup>
                {images.map((item, index) => (
                  <Image
                    key={`image-${timeLine._id}-${index}`}
                    src={item.src}
                    width={50}
                    height={50}
                    style={{ objectFit: "cover", borderRadius: "4px" }}
                    loading="lazy"
                    placeholder={
                      <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: "4px" }} />
                    }
                  />
                ))}
              </Image.PreviewGroup>
            </div>
          )}

          {/* 视频预览 Modal */}
          {previewVisible && (
            <Image
              style={{ display: "none" }}
              preview={{
                visible: previewVisible,
                onVisibleChange: (visible) => setPreviewVisible(visible),
                imageRender: () => (
                  <video controls autoPlay style={{ maxWidth: "100%", maxHeight: "80vh" }}>
                    <source src={currentVideoSrc} type="video/mp4" />
                  </video>
                ),
                toolbarRender: () => null,
              }}
            />
          )}

          {/* 地理位置信息 */}
          {timeLine.extends?.geo?.city && (
            <div className="mt-1">
              <a
                style={{ fontSize: "12px", color: "gray" }}
                target="_blank"
                rel="noopener noreferrer"
                href={`https://restapi.amap.com/v3/staticmap?location=${timeLine.extends.geo.longitude},${timeLine.extends.geo.latitude}&zoom=12&size=750*300&scale=2&markers=mid,,A:${timeLine.extends.geo.longitude},${timeLine.extends.geo.latitude}&key=${process.env.NEXT_PUBLIC_AMAP_ACCESS_KEY}`}
              >
                <Image
                  src={"/location.png"}
                  width={16}
                  height={16}
                  style={{ display: "inline" }}
                  alt="location"
                  loading="lazy"
                  preview={false}
                />
                <span className="pl-1">
                  {timeLine.extends.geo.city}
                  {timeLine.extends.geo.district}
                  {timeLine.extends.geo.street && `${timeLine.extends.geo.street}(附近)`}
                </span>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NodeChild;
