'use client'
import React, { useState } from 'react';
import { Timeline, Divider } from 'antd';
import { Metadata } from 'next';
import './page.scss';
import NodeLabel from '@/components/timeline/NodeLabel';
import NodeChild from '@/components/timeline/NodeChild';

const timeLineData = [
    {date: '2015/09/01', week: 'Wed.', content: '下拉😠选择器通常包含选择器及下拉框，下拉框展示选项列表，提供单选或者多选的能力。选定的选项可以作为表单中的字段值。'},
    {date: '2015/09/05', week: 'Tues.', content: '下拉选择器用于🏓表单或页面区域的信息筛查选择，同时用于替代系统原生 select，在限定的可选项内进行快速选择，核心能力是选择。'},
    {date: '2015/09/07', week: 'Sat.', content: '标签上的文字应该简洁、无歧义并能准确描述出它所对应的内容区的信息特征。'},
    {date: '2015/09/21', week: 'Mon.', content: ' 表单标题区域可承载表单标题文本、必👨🏼‍✈️填提示、帮助图标等，具体参考 CnForm 组件规范。'},
];

const TimeLinePage = () => {
  return (
    <div class="w-3/5 my-24 mx-auto">
        <h1 class="text-center font-500 text-2xl">
            Life Time Line            
            <span class="text-xs pl-3 text-zinc-400">2023.09.01 develop</span>
        </h1>        
        <Divider orientation="left" plain></Divider>
        <Timeline mode='left'
        items={timeLineData.map(item => {
            return {label: <NodeLabel nodeData={item}/>, color: 'gray', children: <NodeChild nodeData={item}/>}
        })}
        />
    </div>
  )
}

export default TimeLinePage