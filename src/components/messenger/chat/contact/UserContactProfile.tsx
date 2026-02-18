import { Col } from "reactstrap";
import SocialInformation from "./SocialInformation";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { ImagePath } from "../../../../constants";
import { Image } from "../../../../shared/image";
import { setAudioCall, setVideoCall } from "../../../../redux/reducers/messenger/messengerSlice";

const UserContactProfile = () => {
  const dispatch = useAppDispatch();
  const { activeContactUser } = useAppSelector((state) => state.messenger);
  const ActiveUser = activeContactUser.find((user) => user.active === true);

  return (
    <Col sm="5">
      <div className="user-profile">
        <div className="user-content">
          <Image className="img-fluid bg-icon" src={`${ImagePath}/contact/${ActiveUser?.avatar}.jpg`} alt="user-img" />
          <h3>{ActiveUser?.userName}</h3>
          <ul>
            <li><i className="fa fa-twitch" />message</li>
            <li><i className="fa fa-phone" onClick={() => dispatch(setAudioCall())} />voice call</li>
            <li><i className="fa fa-video-camera" onClick={() => dispatch(setVideoCall())} />video call</li>
          </ul>
        </div>
      </div>
      <SocialInformation />
    </Col>
  );
};

export default UserContactProfile;
