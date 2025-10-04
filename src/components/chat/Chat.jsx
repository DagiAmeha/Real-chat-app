import EmojiPicker from "emoji-picker-react";
import "./chat.css";
import { useEffect, useRef, useState } from "react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import "../list/userInfo/userInfo.css";

function Chat() {
  const [chat, setChat] = useState({});
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [showDialog, setShowDialog] = useState(false); // NEW → for modal visibility

  const textareaRef = useRef(null);

  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();
  const { currentUser } = useUserStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
  };

  const handleSend = async () => {
    if (text === "" && !img.file) return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIds = [currentUser.id, user.id];

      userIds.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        console.log("user id :", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          userChatsData.chats[chatIndex].lastMessage =
            text || (imgUrl ? "📷 Image" : "");
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }

    // Reset states
    setImg({ file: null, url: "" });
    setText("");
    setShowDialog(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
      setShowDialog(true); // Open modal immediately
    }
  };

  return (
    <div className="chat">
      {/* Top user info */}
      <div className="top">
        <div className="user">
          {user.avatar ? (
            <img className="profile" src={user.avatar} alt="" />
          ) : (
            <div className="profile profile-letter">{user.username[0]}</div>
          )}
          <div className="texts">
            <span>{user?.username}</span>
            <p>last seen recently</p>
          </div>
        </div>
        <div className="icons">
          <img src="imgs/phone.png" alt="" />
          <img src="imgs/video.png" alt="" />
          <img src="imgs/info.png" alt="" />
        </div>
      </div>

      {/* Chat messages */}
      <div className="center chatArea">
        {chat?.messages?.length !== 0 ? (
          chat?.messages?.map((message, index) => (
            <div
              className={
                message.senderId === currentUser.id ? "message own" : "message"
              }
              key={index}
            >
              {message.senderId === user?.id &&
                (user.avatar ? (
                  <img className="profile" src={user.avatar} alt="" />
                ) : (
                  <div className="profile profile-letter">
                    {user.username[0]}
                  </div>
                ))}
              <div
                className={`texts messageText ${
                  message.img && "image-message"
                } `}
              >
                {message.img && <img src={message.img} alt="" />}
                {message.text && (
                  <p className={`text-message ${message.img && "transparent"}`}>
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-message">
            <p>No messages yet. start a conversation.</p>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      {/* Bottom input area */}
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="imgs/img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="imgs/mic.png" alt="" />
        </div>

        <textarea
          ref={textareaRef}
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You can not send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "40px"; // Reset height
            e.target.style.height = e.target.scrollHeight + "px"; // Set to scrollHeight
          }}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            style={{ width: "32px", height: "32px" }}
            src="imgs/emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>

      {/* MODAL PREVIEW */}
      {showDialog && (
        <div
          className="overlay"
          onClick={() => {
            setImg({ file: null, url: "" });
            setShowDialog(false);
            setText("");
          }}
        >
          <div className="dialog">
            <img src={img.url} alt="preview" className="preview-img" />
            <textarea
              className="caption-input"
              placeholder="Add a caption..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setImg({ file: null, url: "" });
                  setShowDialog(false);
                  setText("");
                }}
              >
                Cancel
              </button>
              <button className="sendButton" onClick={handleSend}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
