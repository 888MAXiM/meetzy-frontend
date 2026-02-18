import { Row } from "reactstrap";
import { useAppDispatch } from "../../../../redux/hooks";
import { setMobileMenu } from "../../../../redux/reducers/messenger/messengerSlice";
import PersonalInformation from "./PersonalInformation";
import UserContactProfile from "./UserContactProfile";

const Contact = () => {
  const dispatch = useAppDispatch();

  return (
    <div className="contact-sub-content">
      <a className="icon-btn btn-outline-primary button-effect mobile-back mb-3" onClick={() => dispatch(setMobileMenu())}>
        <i className="ti-angle-left" />
      </a>
      <Row>
        <UserContactProfile />
        <PersonalInformation />
      </Row>
    </div>
  );
};

export default Contact;
