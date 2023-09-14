import React, { useState, useCallback } from "react";
import Gallery from "react-photo-gallery";
import Carousel, { Modal, ModalGateway } from "react-images";
import ReactMarkdown from "react-markdown";
import { DeleteOutlined } from "@ant-design/icons";
import { Row, Col, Button, Modal as AntModal } from "antd";
import gfm from "remark-gfm";
import { deleteTimeLine } from "@/database/modules/TimeLineDataAction";
import Image from "next/image";

const NodeChild = (props) => {
  const { timeLine, isDelete, setIsDelete, setLoading } = props;
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);

  const [video, setVideo] = useState();
  const [videoModal, setVideoModal] = useState(false);

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const openLightbox = useCallback((event, { photo, index }) => {
    if (photo.src === "/play.png") {
      const videoUrl = timeLine.photos[index].src;
      setVideo(videoUrl);
      setVideoModal(true);
    } else {
      setCurrentImage(index);
      setViewerIsOpen(true);
    }
  }, []);

  const closeLightbox = () => {
    setCurrentImage(0);
    setViewerIsOpen(false);
  };

  const removeTimeLine = async (id) => {
    setLoading(true);
    await deleteTimeLine({ _id: id });
    setIsDelete(false);
  };

  const videModalClose = () => {
    setVideo(null);
    setVideoModal(false);
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={isDelete ? 20 : 24}>
          <ReactMarkdown remarkPlugins={[gfm]}>
            {timeLine.content}
          </ReactMarkdown>
        </Col>
        {isDelete ? (
          <Col span={4}>
            <Button
              shape="circle"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeTimeLine(timeLine._id)}
            />
          </Col>
        ) : (
          <></>
        )}
      </Row>

      <Gallery
        photos={
          isIOS
            ? timeLine.photos
            : timeLine.photos.map((item) => {
                return item.src.endsWith("mp4")
                  ? { src: "/play.png", width: 20, height: 30 }
                  : item;
              })
        }
        direction={"row"}
        onClick={openLightbox}
        targetRowHeight={100}
      />

      {/* 地理位置信息 */}
      {timeLine.extends ? (
        <div className="mt-1">
          <a
            style={{ fontSize: "12px", color: "gray" }}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://restapi.amap.com/v3/staticmap?location=${timeLine.extends.geo.longitude},${timeLine.extends.geo.latitude}&zoom=12&size=750*300&scale=2&markers=mid,,A:${timeLine.extends.geo.longitude},${timeLine.extends.geo.latitude}&key=3e33b6ce0066e396d97bca3cb96a6693`}
          >
            <Image
              src={"/loc2.png"}
              width={16}
              height={16}
              style={{ display: "inline" }}
              alt="location"
            />
            <span className="pl-1">
              {timeLine.extends.geo.city}
              {timeLine.extends.geo.district}
              {timeLine.extends.geo.street}(附近)
            </span>
          </a>
        </div>
      ) : (
        <></>
      )}

      {/* 图片轮播 Modal */}
      <ModalGateway>
        {viewerIsOpen ? (
          <Modal onClose={closeLightbox}>
            <Carousel
              currentIndex={currentImage}
              views={timeLine.photos
                .filter((x) => !x.src.endsWith(".mp4"))
                .map((x) => ({
                  ...x,
                  srcset: x.srcSet,
                  caption: x.title,
                }))}
            />
          </Modal>
        ) : null}
      </ModalGateway>

      {/* 视频播放 Modal */}
      <AntModal
        title="PLAY"
        open={videoModal}
        centered={true}
        afterClose={videModalClose}
        onOk={videModalClose}
        onCancel={videModalClose}
      >
        <video controls>
          <source src={video} type="video/mp4" />
        </video>
      </AntModal>
    </>
  );
};

export default NodeChild;
