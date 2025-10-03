import { useEffect, useState } from "react";
import AddUser from "./addUser/AddUser";
import "./chatList.css";
import "../userInfo/userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

function ChatList() {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data().chats;

        const promisses = items.map(async (chat) => {
          const userDocRef = doc(db, "users", chat.receiverId);
          const userDocSnap = await getDoc(userDocRef);

          const user = userDocSnap.data();

          return { ...chat, user };
        });

        const chatsData = await Promise.all(promisses);
        console.log("Chats Data:", chatsData);

        setChats(
          chatsData.sort((a, b) => {
            return b.updatedAt - a.updatedAt;
          })
        );
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((c) => {
      const { user, ...rest } = c;
      return rest;
    });

    const chatIndex = userChats.findIndex((c) => c.chatId === chat.chatId);
    userChats[chatIndex].isSeen = true;

    const userChatRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.error("Error updating chat:", err);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.user.username.toLowerCase().includes(input.toLowerCase())
  );
  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="/search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.length > 0 ? (
        filteredChats.map((chat) => {
          return (
            <div
              className="item"
              key={chat.chatId}
              onClick={() => handleSelect(chat)}
              style={{
                backgroundColor: chat.isSeen ? "transparent" : "#5183fe",
              }}
            >
              {chat.user.blocked.includes(currentUser.id) ||
              !chat.user.avatar ? (
                <div className="profile profile-letter">
                  {chat.user.username[0]}
                </div>
              ) : (
                <img src={chat.user.avatar} alt="" />
              )}

              <div className="texts">
                <span>
                  {chat.user.blocked.includes(currentUser.id)
                    ? "User"
                    : chat.user.username}
                </span>
                <p>
                  {chat.lastMessage.length > 20
                    ? `${chat.lastMessage.slice(0, 20)}...`
                    : chat.lastMessage}
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="noChats">
          <p style={{ textAlign: "center" }}>
            No chats found. click + to start conversation.
          </p>
        </div>
      )}

      {addMode && (
        <AddUser setAddMode={setAddMode} filteredChats={filteredChats} />
      )}
    </div>
  );
}

export default ChatList;
