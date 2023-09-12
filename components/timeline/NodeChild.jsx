import React, { useState, useCallback } from "react";
import Gallery from "react-photo-gallery";
import Carousel, { Modal, ModalGateway } from "react-images";
import ReactMarkdown from "react-markdown";
import { DeleteOutlined } from "@ant-design/icons";
import { Row, Col, Button } from "antd";
import gfm from "remark-gfm";
import { deleteTimeLine } from "@/database/modules/TimeLineDataAction";

const NodeChild = (props) => {
  const { timeLine, isDelete, setIsDelete, setLoading } = props;
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);

  const openLightbox = useCallback((event, { photo, index }) => {
    setCurrentImage(index);
    setViewerIsOpen(true);
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
        photos={timeLine.photos}
        direction={"row"}
        onClick={openLightbox}
        targetRowHeight={100}
      />
      <ModalGateway>
        {viewerIsOpen ? (
          <Modal onClose={closeLightbox}>
            <Carousel
              currentIndex={currentImage}
              views={timeLine.photos.map((x) => ({
                ...x,
                srcset: x.srcSet,
                caption: x.title,
              }))}
            />
          </Modal>
        ) : null}
      </ModalGateway>
    </>
  );
};

export default NodeChild;
