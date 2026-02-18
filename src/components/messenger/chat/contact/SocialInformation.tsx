import { ImagePath } from "../../../../constants";
import { socialInformationData } from "../../../../data/messenger";
import { Image } from "../../../../shared/image";

const SocialInformation = () => {
  return (
    <div className="personal-info-group">
      <div className="social-info-group">
        <ul className="integratin mt-0">
          {socialInformationData.map((item, index) => (
            <li key={index}>
              <div className="d-flex">
                <div className="media-left">
                  <a className={item.class} href={item.url}>
                    <i className={`fa fa-${item.icon} me-2`} />
                    <h5>{item.title}</h5>
                  </a>
                </div>
                <div className="media-right">
                  <div className="profile bg-size">
                    <Image className="bg-img img-fluid" src={`${ImagePath}/contact/${index + 1}.jpg`} alt="Avatar" />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SocialInformation;
