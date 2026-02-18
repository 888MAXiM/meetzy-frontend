import { Col } from "reactstrap";
import { Image } from "./image";
import { ImagePath } from "../constants";
import type { SearchNotFoundClassType } from "../types/components/chat";

const SearchNotFoundClass: React.FC<SearchNotFoundClassType> = ({ word }) => {
  return (
    <Col sm="12">
      <div>
        <div className="search-not-found text-center p-5">
          <Image className="img-100 mb-4" src={`${ImagePath}/gif/sad.gif`} alt="not-found" />
          <p>{word}</p>
        </div>
      </div>
    </Col>
  );
};

export default SearchNotFoundClass;
