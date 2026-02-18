import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setTemplateLayoutData } from "../../redux/reducers/templateCustomizerSlice";

const TemplateLayout = () => {
  const dispatch = useAppDispatch();
  const { templateLayout } = useAppSelector((state) => state.templateCustomizer);
  return (
    <div className="template-layout">
      <h5>Layout</h5>
      <ul>
        {templateLayout.map((item, index) => (
          <li className={item.active ? "active" : ""} data-attr={item.layoutValue} key={index} onClick={() => dispatch(setTemplateLayoutData(item.layoutValue))}>
            <div className="sidebar" />
            <div className="sidebar-content" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TemplateLayout;
