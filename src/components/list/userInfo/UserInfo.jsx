import { useUserStore } from "../../../lib/userStore";
import "./userInfo.css";

function UserInfo() {
  const { currentUser } = useUserStore();
  return (
    <div className="userInfo">
      <div className="user">
        {currentUser.avatar ? (
          <img className="profile" src={currentUser.avatar} alt="" />
        ) : (
          <div className="profile profile-letter">
            {currentUser.username[0]}
          </div>
        )}
        <h2>{currentUser?.username}</h2>
      </div>

      <div className="icons">
        <img src="imgs/video.png" alt="" />
        <img src="imgs/edit.png" alt="" />
      </div>
    </div>
  );
}

export default UserInfo;
