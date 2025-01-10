const NavItem = ({ icon, text, isActive = false, onClick }) => {
  return (
    <a
      className={`flex items-center py-2.5 group cursor-pointer ${
        isActive ? 'font-semibold' : 'font-normal'
      }`}
      onClick={onClick}
    >
      <span className="shrink-0">{icon}</span>
      <span className="ml-2 transition-transform group-hover:translate-x-1">
        {text}
      </span>
    </a>
  );
}

export default NavItem;
