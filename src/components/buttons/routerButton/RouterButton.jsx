import { Link } from "react-router";
import "../button/Button.scss";

function RouterButton({ to, name, icon, icon2, onClick, style, size }) {
  const Icon = icon;
  const Icon2 = icon2;

  return (
    <Link to={to} className={style} onClick={onClick}>
      {Icon2 && <Icon2 size={size ? size : 16} />}
      {name}
      {icon && <Icon size={size ? size : 16} />}
    </Link>
  );
}

export default RouterButton;
