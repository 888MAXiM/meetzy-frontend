import { useEffect } from 'react'

export const useMobileMenuEffect = (mobileMenu: boolean) => {
  useEffect(() => {
    const sidebarToggle = document.querySelector('.sidebar-toggle')
    if (mobileMenu) {
      sidebarToggle?.classList.add('mobile-menu')
    } else {
      sidebarToggle?.classList.remove('mobile-menu')
    }
  }, [mobileMenu])
}

export const useAppSidebarEffect = (toggleSmallSide: boolean) => {
  useEffect(() => {
    const meetzyMain = document.querySelector('.meetzy-main')
    const appSidebar = document.querySelector('.app-sidebar')

    if (toggleSmallSide) {
      meetzyMain?.classList.add('small-sidebar')
      appSidebar?.classList.add('active')
      document.body.classList.add('sidebar-active', 'main-page')
    } else {
      meetzyMain?.classList.remove('small-sidebar')
      appSidebar?.classList.remove('active')
      document.body.classList.remove('sidebar-active', 'main-page')
    }
  }, [toggleSmallSide])
}

export const useProfileSidebarEffect = (profileToggle: boolean, profileSidebarWidth: number) => {
  useEffect(() => {
    const meetzyMain = document.querySelector('.meetzy-main')
    const appSidebar = document.querySelector('.app-sidebar')
    const sidebarToggle = document.querySelector('.sidebar-toggle')

    if (profileToggle) {
      document.body.classList.add('menu-active')
      meetzyMain?.classList.remove('small-sidebar')
      appSidebar?.classList.remove('active')

      if (profileSidebarWidth <= 800) {
        sidebarToggle?.classList.add('mobile-menu', 'sidebar-overlap')
      }
    } else {
      document.body.classList.remove('menu-active')
      meetzyMain?.classList.add('small-sidebar')
      appSidebar?.classList.add('active')

      if (profileSidebarWidth >= 800) {
        sidebarToggle?.classList.remove('mobile-menu', 'sidebar-overlap')
      }
    }
  }, [profileToggle, profileSidebarWidth])
}

export const useSidebarToggleEffect = (sidebarToggle: boolean, profileSidebarWidth: number) => {
  useEffect(() => {
    const mainNav = document.querySelector('.main-nav')
    const shouldCloseSidebar = profileSidebarWidth <= 800 ? !sidebarToggle : sidebarToggle

    if (shouldCloseSidebar) {
      mainNav?.classList.add('on')
    } else {
      mainNav?.classList.remove('on')
    }
  }, [sidebarToggle, profileSidebarWidth])
}
