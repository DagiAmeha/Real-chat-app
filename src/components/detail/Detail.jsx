import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";
import { useEffect, useState } from "react";

function Detail() {
  const [imgs, setImgs] = useState([]);
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } =
    useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (doc) => {
      const messages = doc.data()?.messages;
      const img = messages
        ? messages
            .filter((message) => message.img)
            .map((message) => message.img)
            .slice(0, 6)
        : [];

      setImgs(img);
    });

    return () => {
      unSub();
    };
  });
  const { currentUser } = useUserStore();
  const handleBlock = async () => {
    console.log(user);
    if (!user) return;
    const userDocRef = doc(db, "users", currentUser.id);
    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.error("Error blocking user:", err);
    }
  };
  return (
    <div className="detail">
      <div className="user">
        {user.avatar ? (
          <img className="detail-profile" src={user.avatar} alt="" />
        ) : (
          <div className="detail-profile detail-profile-letter">
            {user.username[0]}
          </div>
        )}
        <h2>{user?.username}</h2>
        <p>last seen recently</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="imgs/arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & Help</span>
            <img src="imgs/arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Photos </span>
            <img src="imgs/arrowDown.png" alt="" />
          </div>
          <div className="photos">
            {imgs.length !== 0 &&
              imgs
                .slice(-6)
                .map((img, idx) => (
                  <img src={img} key={idx} alt="" loading="lazy" />
                ))}
          </div>
        </div>
      </div>
      <div className="buttons">
        <button onClick={handleBlock}>
          {isCurrentUserBlocked
            ? "You are Blocked"
            : isReceiverBlocked
            ? "User Blocked"
            : "Block User"}
        </button>
        <button className="logout" onClick={() => auth.signOut()}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Detail;
