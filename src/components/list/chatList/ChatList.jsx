import { useEffect, useState } from "react";
import AddUser from "./addUser/AddUser";
import "./chatList.css";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
function ChatList() {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);

  const { currentUser } = useUserStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data().chats;

        const promisses = items.map(async (chat) => {
          const userDocRef = doc(db, "users", chat.userId);
          const userDocSnap = await getDocs(userDocRef);

          const user = userDocSnap.data();

          return { ...chat, user };
        });

        const chatsData = await Promise.all(promisses);

        setChats(
          chatsData.sort((a, b) => {
            b.updatedAt - a.updatedAt;
          })
        );
      }
    );

    return () => {
      unSub();
    };
  }, []);
  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="/search.png" alt="" />
          <input type="text" placeholder="Search" />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {chats.map((chat) => {
        return (
          <div className="item" key={chat.chatId}>
            <img src="./avatar.png" alt="" />
            <div className="texts">
              <span>chat</span>
              <p>{chat.lastMessage}</p>
            </div>
          </div>
        );
      })}

      {addMode && <AddUser />}
    </div>
  );
}

export default ChatList;
