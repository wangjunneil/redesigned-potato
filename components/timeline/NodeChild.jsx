import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { DeleteOutlined } from "@ant-design/icons";
import { Row, Col, Button, Modal as AntModal, Image } from "antd";
import gfm from "remark-gfm";
import { deleteTimeLine } from "@/database/modules/TimeLineDataAction";
// import Image from "next/image";

const NodeChild = (props) => {
  const { timeLine, isDelete, setIsDelete, setLoading } = props;

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

      {timeLine.photos
        .filter((item) => item.src.endsWith("mp4") || item.src.endsWith("mov"))
        .map((item) => (
          <Image
            width={50}
            preview={{
              imageRender: () => (
                <video controls>
                  <source src={item.src} type="video/mp4" />
                </video>
              ),
              toolbarRender: () => null,
            }}
            src="/play.png"
          />
        ))}
      <Image.PreviewGroup
        preview={{
          onChange: (current, prev) =>
            console.log(`current index: ${current}, prev index: ${prev}`),
        }}
      >
        {timeLine.photos
          .filter(
            (item) => !item.src.endsWith("mp4") && !item.src.endsWith("mov")
          )
          .map((item) => (
            <Image src={item.src} width={50} />
          ))}
      </Image.PreviewGroup>

      {/* 地理位置信息 */}
      {timeLine.extends ? (
        <div className="mt-1">
          <a
            style={{ fontSize: "12px", color: "gray" }}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://restapi.amap.com/v3/staticmap?location=${timeLine.extends.geo.longitude},${timeLine.extends.geo.latitude}&zoom=12&size=750*300&scale=2&markers=mid,,A:${timeLine.extends.geo.longitude},${timeLine.extends.geo.latitude}&key=${process.env.AMAP_ACCESS_KEY}`}
          >
            <Image
              src={"/location.png"}
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
    </>
  );
};

export default NodeChild;
