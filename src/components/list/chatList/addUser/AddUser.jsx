import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import "./addUser.css";
import { db } from "../../../../lib/firebase";
import { use, useState } from "react";
import { useUserStore } from "../../../../lib/userStore";
import { useChatStore } from "../../../../lib/chatStore";

function AddUser({ setAddMode, filteredChats }) {
  const [user, setUser] = useState(null);
  const [found, setFound] = useState(true);

  const { currentUser } = useUserStore();
  console.log("current user id; ", currentUser.id);
  const { changeChat } = useChatStore();
  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");

      const q = query(userRef, where("username", "==", username));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUser(querySnapshot.docs[0].data());
        console.log("user id :", querySnapshot.docs[0].data().id);
      } else {
        setFound(false);
        setUser(null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    if (
      filteredChats.some((chat) => chat.user.id === user.id) ||
      user.id === currentUser.id
    ) {
      setAddMode(false);
      return;
    }
    const chatRef = collection(db, "chats");
    console.log(chatRef);
    const userChatRef = collection(db, "userchats");
    try {
      const newChatRef = doc(chatRef);
      console.log("New Chat ID:", newChatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Update the other user's userchats, creating it if it doesn't exist
      await setDoc(
        doc(userChatRef, user.id),
        {
          chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: "",
            isSeen: false,
            receiverId: currentUser.id,
            updatedAt: Date.now(),
          }),
        },
        { merge: true }
      );

      // Update current user's userchats
      await setDoc(
        doc(userChatRef, currentUser.id),
        {
          chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: "",
            isSeen: true,
            receiverId: user.id,
            updatedAt: Date.now(),
          }),
        },
        { merge: true }
      );

      setAddMode(false);
      changeChat(newChatRef.id, user);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user ? (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <p>{user.username}</p>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      ) : (
        found || (
          <div className="not-found">
            <p style={{ textAlign: "center" }}>
              No user found with this username.
            </p>
          </div>
        )
      )}
    </div>
  );
}

export default AddUser;
