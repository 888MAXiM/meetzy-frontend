import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { openCloseSidebar } from "../../redux/reducers/messenger/messengerSlice";

const SidebarSetting = () => {
  const dispatch = useAppDispatch();
  const { sidebarToggle } = useAppSelector((state) => state.messenger);

  return (
    <div className="sidebar-setting">
      <h5>Sidebar</h5>
      <ul>
        <li className={`three-column ${sidebarToggle === false ? "active" : ""}`} onClick={() => dispatch(openCloseSidebar())}>
          <div className="sm-sidebar" />
          <div className="sidebar" />
          <div className="sidebar-content" />
        </li>
        <li className={`two-column ${sidebarToggle === true ? "active" : ""}`}>
          <div className="sidebar" />
          <div className="sidebar-content" onClick={() => dispatch(openCloseSidebar())} />
        </li>
      </ul>
    </div>
  );
};

export default SidebarSetting;
