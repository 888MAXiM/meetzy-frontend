import { useAppSelector } from "../../../../redux/hooks";

const PersonalInformation = () => {
  const { activeContactUser } = useAppSelector((state) => state.messenger);
  const ActiveUser = activeContactUser.find((user) => user.active === true);
  return (
    <div className="col-sm-7">
      <div className="personal-info-group">
        <h3>contact info</h3>
        <ul className="basic-info">
          <li>
            <h5>name</h5>
            <h5 className="details">{ActiveUser?.userName}</h5>
          </li>
          <li>
            <h5>Favorite Book</h5>
            <h5 className="details">Perfect Chemistry</h5>
          </li>
          <li>
            <h5>Personality</h5>
            <h5 className="details">Cool</h5>
          </li>
          <li>
            <h5>City</h5>
            <h5 className="details">Moline Acres</h5>
          </li>
          <li>
            <h5>mobile no</h5>
            <h5 className="details">{ActiveUser?.number}</h5>
          </li>
          <li>
            <h5>email</h5>
            <h5 className="details">pixelstrap@test.com</h5>
          </li>
          <li>
            <h5>Website</h5>
            <h5 className="details">www.test.com</h5>
          </li>
          <li>
            <h5 className="m-0">Interest</h5>
            <h5 className="details">Photography</h5>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PersonalInformation;
