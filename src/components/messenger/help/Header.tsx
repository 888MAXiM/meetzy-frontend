import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Container,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  NavItem,
  NavLink,
} from 'reactstrap'
import { useAppSelector } from '../../../redux/hooks'
import { setTemplateLayoutData } from '../../../redux/reducers/templateCustomizerSlice'
import { SvgIcon } from '../../../shared/icons'
import { Image } from '../../../shared/image'
import { HelpHeaderProps } from '../../../types/components/help'

const Header = ({ activeTab, setActiveTab, setOpen, tabArray }: HelpHeaderProps) => {
  const dispatch = useDispatch()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const toggleDropdown = () => setDropdownOpen((prev) => !prev)
  const { mainSidebarActiveTab } = useAppSelector((state) => state.mainSidebar)
  const { templateLayout } = useAppSelector((state) => state.templateCustomizer)

  const mainSlugs = ['faqs', 'terms', 'privacy-policy']
  const mainTabs = tabArray.filter((tab) => mainSlugs.includes(tab.slug?.toLowerCase()))
  const extraTabs = tabArray.filter((tab) => !mainSlugs.includes(tab.slug?.toLowerCase()))

  const currentTheme = templateLayout.find((item) => item.active)?.layoutValue || 'light'
  const handleModeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    dispatch(setTemplateLayoutData(newTheme))
  }

  return (
    <div>
      <div className="home-section">
        <Navbar className="navbar-expand-lg" light>
          <Container className="custom-container">
            <div className="main-menu">
              <NavbarBrand className="d-flex">
                <Image src="/logos/favicon.png" alt="ChatLogo" height={35} />
                <p>Help Center</p>
              </NavbarBrand>
              <div>
                <NavbarToggler className="collapsed">
                  <i className="fa fa-bars"></i>
                </NavbarToggler>
              </div>
              <ul className="nav-right">
                <li>
                  <a
                    className={`btn border-light mode p-0 ${mainSidebarActiveTab === 'mode' ? 'active' : 'active'}`}
                    title="Dark"
                  >
                    <SvgIcon
                      className="common-svg-hw for-light"
                      iconId="sun"
                      onClick={(e) => {
                        e.preventDefault()
                        handleModeToggle()
                      }}
                    />
                    <SvgIcon
                      className="common-svg-hw for-dark"
                      iconId="mode"
                      onClick={(e) => {
                        e.preventDefault()
                        handleModeToggle()
                      }}
                    />
                  </a>
                </li>
                <li
                  onClick={() => {
                    setOpen(false)
                    setActiveTab('')
                  }}
                >
                  <h3>Contact</h3>
                </li>
              </ul>
            </div>
          </Container>
        </Navbar>
        <Container className="custom-container">
          <div className="document">Hi! How can we help?</div>
          <div className="top-heading"></div>
        </Container>
        <div className="bottom-header">
          <Nav tabs className="border-0">
            {mainTabs.map((tab) => (
              <NavItem key={tab.id} className="mx-2">
                <NavLink
                  className={tab.id === activeTab ? 'active' : ''}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setOpen(true)
                  }}
                  role="button"
                >
                  {tab.title}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
          {extraTabs.length > 0 && (
            <Dropdown nav inNavbar isOpen={dropdownOpen} toggle={toggleDropdown} className="mx-2">
              <DropdownToggle nav className="p-0 border-0 bg-transparent">
                <SvgIcon iconId="more-vertical" className="common-svg-hw-btn" />
              </DropdownToggle>
              <DropdownMenu>
                {extraTabs.map((tab) => (
                  <DropdownItem
                    key={tab.id}
                    active={tab.id === activeTab}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setDropdownOpen(false)
                      setOpen(true)
                    }}
                  >
                    {tab.title}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header
