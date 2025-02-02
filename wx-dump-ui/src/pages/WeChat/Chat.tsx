import { queryMsg } from '@/services/Wechat/Msg';
import { Avatar, Button, Card, Flex, Image, List, Spin, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import './Style/Chat.less';

interface ChatProps {
  userName?: string;
}

const { Text } = Typography;

const Chat: React.FC<ChatProps> = ({ userName }) => {
  const [initLoading, setInitLoading] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [lastCreateTime, setCreateTime] = useState<number>(9999999999);
  const [chatList, setChatList] = useState<MsgItem[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);

  let lastDisplayedTime: number | null = null;

  const shouldDisplayTime = (currentTime: number) => {
    if (!lastDisplayedTime || currentTime - lastDisplayedTime >= 900000) {
      lastDisplayedTime = currentTime;
      return true;
    }
    return false;
  };

  const getMsg = async (lastCreateTime: number) => {
    if (userName) {
      setInitLoading(true);
      const response = await queryMsg({ talker: userName, lastCreateTime: lastCreateTime });
      if (response.data && response.data.length > 0) {
        setPrevScrollHeight(chatContainerRef.current ? chatContainerRef.current.scrollHeight : 0);
        setChatList((prevChatList) => [...(response.data || []), ...prevChatList]);
        setCreateTime(response.data[0].createTime);
      } else {
        setAllLoaded(true);
      }
      setInitLoading(false);
    }
  };

  useEffect(() => {
    const newCreateTime = 9999999999;
    setCreateTime(newCreateTime);
    setAllLoaded(false);
    setChatList([]);
    getMsg(newCreateTime);
  }, [userName]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const newScrollTop = chatContainerRef.current.scrollHeight - prevScrollHeight;
      chatContainerRef.current.scrollTop = newScrollTop;
      setPrevScrollHeight(chatContainerRef.current.scrollHeight);
    }
  }, [chatList]);

  return (
    <div className="chat-scrollbar" ref={chatContainerRef}>
      {userName && !allLoaded && (
        <div className="more-msg">
          <Button disabled={initLoading} type="link" onClick={() => getMsg(lastCreateTime)}>
            查看更多消息
          </Button>
        </div>
      )}
      <List
        itemLayout="horizontal"
        dataSource={chatList}
        loading={initLoading}
        renderItem={(item) => (
          <>
            {shouldDisplayTime(item.createTime * 1000) && (
              <Flex justify="center" align="center" className="msg-system">
                <Text code>{item.strCreateTime}</Text>
              </Flex>
            )}

            {item.type === 10000 && item.subType === 0 ? (
              <Flex justify="center" align="center" className="msg-system">
                <Text className="msg-system-text">{item.strContent}</Text>
              </Flex>
            ) : (
              <Flex className={`msg-item ${item.isSender === 1 ? 'sender' : 'receiver'}`}>
                <Flex align="start" className="msg-content">
                  <Avatar className="msg-avatar" src={item.avatar} size={38} />
                  <Flex>
                    {(() => {
                      if (item.type === 3 && item.subType === 0) {
                        return (
                          <Flex
                            className={`message-text ${
                              item.isSender === 1 ? 'sender' : 'receiver'
                            }`}
                          >
                            <Image
                              width={200}
                              src={`/api/image/downloadImgFormLocal?localPath=${encodeURIComponent(item.thumb)}`}
                              preview={{
                                src: `/api/image/downloadImgFormLocal?localPath=${encodeURIComponent(item.image)}`,
                              }}
                              placeholder={
                                <Flex justify="center">
                                  <Spin size="small" />
                                </Flex>
                              }
                            />
                          </Flex>
                        );
                      } else if (item.type === 47 && item.subType === 0) {
                        return (
                          <Image
                            width={200}
                            src={`/api/image/downloadImg?path=${encodeURIComponent(item.emojiUrl)}`}
                          />
                        );
                      } else if (item.type === 49 && (item.subType === 33 || item.subType === 36)) {
                        return (
                          <Card
                            hoverable
                            className="msg-we-app-info"
                            cover={
                              <Image
                                src={`/api/image/downloadImg?path=${encodeURIComponent(
                                  item.weAppInfo.weAppPageThumbRawUrl,
                                )}`}
                              />
                            }
                          >
                            <Card.Meta
                              title={item.weAppInfo.sourceDisplayName}
                              description={item.weAppInfo.title}
                            />
                          </Card>
                        );
                      } else if (item.type === 49 && item.subType === 5) {
                        return (
                          <Card
                            className="msg-card-link"
                            type="inner"
                            title={item.cardLink.title}
                            extra={
                              <a target="_blank" href={item.cardLink.url} rel="noreferrer">
                                点击查看
                              </a>
                            }
                          >
                            {item.cardLink.des}
                          </Card>
                        );
                      } else if (item.type === 49 && item.subType === 57) {
                        return (
                          <Flex vertical>
                            <Flex justify={item.isSender === 1 ? 'flex-end' : 'flex-start'}>
                              <Text
                                className={`message-text ${
                                  item.isSender === 1 ? 'sender' : 'receiver'
                                }`}
                              >
                                {item.strContent}
                              </Text>
                            </Flex>
                            <Flex
                              justify={item.isSender === 1 ? 'flex-end' : 'flex-start'}
                              style={{ maxWidth: 400 }}
                            >
                              <Text
                                ellipsis={{ tooltip: item.referMsgContent }}
                                className="refer-msg-content"
                              >
                                {item.referMsgContent}
                              </Text>
                            </Flex>
                          </Flex>
                        );
                      } else {
                        return (
                          <Text
                            className={`message-text ${
                              item.isSender === 1 ? 'sender' : 'receiver'
                            }`}
                          >
                            {item.strContent}
                          </Text>
                        );
                      }
                    })()}
                  </Flex>
                </Flex>
              </Flex>
            )}
          </>
        )}
      />
    </div>
  );
};

export default Chat;
