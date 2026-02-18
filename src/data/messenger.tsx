import { MessageSquare, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Users } from 'react-feather'
import { Mousewheel } from 'swiper/modules'
import { CallFilter } from '../constants'
import { SidebarItem, SidebarTab } from '../types/components/chat'
import { SvgIcon } from '../shared/icons'

export const documentsData = [
  {
    title: 'messenger.html',
    date: '2, October 2024',
    iconClass: 'fa-file-code-o',
    bgColorClass: 'bg-light-danger',
  },
  {
    title: 'chapter1.MP4',
    date: '3, October 2024',
    iconClass: 'fa-file-video-o',
    bgColorClass: 'bg-light-success',
  },
  {
    title: 'salary.xlsx',
    date: '5, October 2024',
    iconClass: 'fa-file-word-o',
    bgColorClass: 'bg-light-primary',
  },
  {
    title: 'document.pdf',
    date: '7, October 2024',
    iconClass: 'fa-file-pdf-o',
    bgColorClass: 'bg-light-warning',
  },
  {
    title: 'details.txt',
    date: '20, October 2024',
    iconClass: 'fa-file-text-o',
    bgColorClass: 'bg-light-danger',
  },
  {
    title: 'messenger.html',
    date: '2, October 2024',
    iconClass: 'fa-file-code-o',
    bgColorClass: 'bg-light-success',
  },
]

export const toDoAllData = [
  { title: 'Landing Redesign', dropdownData: 'Assign To' },
  { title: 'Project Report', dropdownData: 'Assign To' },
  { title: 'Grocery Store App', dropdownData: 'Assign To' },
  { title: 'Background Image', dropdownData: 'Assign To' },
]

//Main Sidebar
export const mainSidebarListData: SidebarItem[] = [
  { type: SidebarTab.CHATS, icon: 'message' },
  { type: SidebarTab.CALL, icon: 'call' },
  { class: 'step1', type: SidebarTab.STATUS, icon: 'sidebar-status' },
  { type: SidebarTab.ARCHIVE, icon: 'archive' },
  { type: SidebarTab.NOTIFICATION, icon: 'notification' },
  { type: SidebarTab.DOCUMENT, icon: 'document' },
  { type: SidebarTab.FRIEND_SUGGESTIONS, icon: 'user-team' },
  { type: SidebarTab.BLOCK_ICON, icon: 'block-icon' },
  { type: SidebarTab.FAVORITE, icon: 'favourite' },
  { class: 'step2', type: SidebarTab.SETTINGS, icon: 'setting' },
]

export const contactStatusData = [
  { id: '1', image: '1', title: 'Josephin water', time: 'today , 8:30am', status: false, active: false },
  { id: '2', image: '2', title: 'Jony Lynetin', time: 'today , 10:30am', status: false, active: false },
  { id: '3', image: '3', title: 'Sufiya Elija', time: 'today , 11:00am', status: false, active: false },
  { id: '4', image: '4', title: 'Mukrani Pabelo', time: 'today , 9:55am', status: false, active: false },
  { id: '5', image: '5', title: 'Pabelo Mukrani', time: 'today , 12:05am', status: false, active: false },
  { id: '6', image: '6', title: 'kelin jasen', time: 'today , 8:30am', status: true, active: false },
  { id: '7', image: '7', title: 'Sufiya Eliza', time: '30 Mins Ago', status: true, active: false },
]

export const notificationData = [
  { image: '1', title: 'Josephin water', text: 'Upload New Photos', class: 'offline' },
  { word: 'A', title: 'Jony Today Birthday', text: 'Upload New Photos', class: 'bg-success offline' },
  { image: '2', title: 'Sufiya Elija', text: 'Comment On your Photo', class: 'offline' },
  { image: '3', title: 'Pabelo Mukrani', text: 'Invite Your New Friend', class: 'unreachable' },
  { word: 'AC', title: 'Pabelo Mukrani', text: 'Update Profile Picture', class: 'bg-success offline' },
]

export const favoriteData = [
  { image: '1', title: 'Josephin water', text: 'Alabma , USA', class: 'offline' },
  { image: '2', title: 'Jony Lynetin', text: 'Los Angeles, California', class: 'online' },
  { image: '3', title: 'Sufiya Elija', text: 'Glasgow , Scotland', class: 'busy' },
  { image: '4', title: 'Pabelo Mukrani', text: 'Leicester , England', class: 'unreachable' },
  { image: '5', title: 'Kristin Watson', text: 'Alabma , Scotland', class: 'offline' },
  { image: '3', title: 'Jesus Watson', text: 'Alabma', class: 'online' },
]

export const chatBackupData = [
  { title: 'Auto Backup', checked: true },
  { title: 'Include document' },
  { title: 'Include Videos' },
]

export const chatData = [
  { title: 'Archive all chat' },
  { title: 'Clear all chats' },
  { title: 'Delete all chats', class: 'font-danger' },
]

export const chatContactSettingListData = [
  { color: 'primary', title: 'new_chat', icon: <MessageSquare /> },
  { color: 'primary', title: 'new_call', icon: <Phone /> },
  { color: 'primary', title: 'new_group', icon: <Users /> },
  { color: 'primary', title: 'new_broadcast', icon: <SvgIcon iconId="broadcast" className="fill-primary" /> },
]

export const messengerTabsData = [
  { class: 'step4', title: 'Chat', icon: 'message-icon', type: 'chat' },
  { title: 'Call', icon: 'phone-icon', type: 'call' },
]

export const chatTabsData = [
  { title: 'Recent', type: 'direct' },
  { title: 'Contact', type: 'contact' },
  { title: 'Group', type: 'group' },
]

export const getPrivateChatData = (lockedLength: number) => {
  const baseTabs = [
    { title: 'all', type: 'all' },
    { title: 'unread', type: 'unread' },
    { title: 'favourite', type: 'favourite' },
    { title: 'groups', type: 'group' },
  ]

  return lockedLength > 0 ? [...baseTabs, { title: 'lockChat', type: 'lock_chat' }] : baseTabs
}

export const chatFriendContent = [
  { class: 'stroke-dark', icon: 'clear', title: 'Clear dark' },
  { class: 'fill-dark', icon: 'block', title: 'Block' },
]

export const callTabData = [
  { title: 'All', type: CallFilter.All, icon: null },
  { type: CallFilter.Incoming, icon: <PhoneIncoming /> },
  { type: CallFilter.Outgoing, icon: <PhoneOutgoing /> },
  { type: CallFilter.Missed, icon: <PhoneMissed /> },
]

export const socialInformationData = [
  { class: 'fb', url: 'https://www.facebook.com/login', icon: 'facebook', title: 'Facebook' },
  { class: 'twi', url: 'https://twitter.com/login', icon: 'twitter', title: 'twitter' },
  {
    class: 'ggl',
    url: 'https://accounts.google.com/signin/v2/identifier?service=mail&passive=true&rm=false&continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&ss=1&scc=1&ltmpl=default&ltmplcache=2&emr=1&osid=1&flowName=GlifWebSignIn&flowEntry=ServiceLogin',
    icon: 'google',
    title: 'google',
  },
]

export const colorPickerData = [
  { class: 'color', color: 'style', active: true },
  { class: 'color1', color: 'style1', active: false },
  { class: 'color2', color: 'style2', active: false },
  { class: 'color3', color: 'style3', active: false },
  { class: 'color4', color: 'style4', active: false },
  { class: 'color5', color: 'style5', active: false },
  { class: 'color6', color: 'style6', active: false },
]

export const templateLayoutData = [
  { active: true, layoutValue: 'light' },
  { active: false, layoutValue: 'dark-sidebar' },
  { active: false, layoutValue: 'dark' },
  { active: false, layoutValue: 'colorfull' },
]

export const chatWallpaperData = [
  {
    id: 1,
    active: false,
    class: 'bg-color',
    wallpaperClass: 'bg-default',
    wallpaperCss: '-webkit-gradient(linear, 0% 0%, 0% 100%, from(rgba(1, 170, 133, 0.1)))',
  },
  { id: 2, active: false, class: 'bg-size', wallpaperImage: '2' },
  { id: 3, active: false, class: 'bg-size', wallpaperImage: '3' },
  { id: 4, active: false, class: 'bg-size', wallpaperImage: '4' },
  { id: 5, active: false, class: 'bg-size', wallpaperImage: '5' },
  { id: 6, active: true, class: 'bg-size', wallpaperImage: '1' },
  {
    id: 7,
    active: false,
    class: 'bg-color',
    wallpaperClass: 'gradient-1',
    wallpaperCss: 'linear-gradient(359.3deg, rgba(1, 170, 133, 0.1) 1%, rgba(187, 187, 187, 0) 70.9%)',
  },
  {
    id: 8,
    active: false,
    class: 'bg-color',
    wallpaperClass: 'gradient-2',
    wallpaperCss:
      'radial-gradient(328px at 2.9% 15%, rgb(191, 224, 251) 0%, rgb(232, 233, 251) 25.8%, rgb(252, 239, 250) 50.8%, rgb(234, 251, 251) 77.6%, rgb(240, 251, 244) 100.7%)',
  },
  {
    id: 9,
    active: false,
    class: 'bg-color',
    wallpaperClass: 'gradient-3',
    wallpaperCss: 'linear-gradient(109.6deg, rgb(223, 234, 247) 11.2%, rgb(244, 248, 252) 91.1%)',
  },
  {
    id: 10,
    active: false,
    class: 'bg-color',
    wallpaperClass: 'gradient-4',
    wallpaperCss: 'linear-gradient(-109.6deg, rgb(204, 228, 247) 11.2%, rgb(237, 246, 250) 100.2%)',
  },
  {
    id: 11,
    active: false,
    class: 'bg-color',
    wallpaperClass: 'gradient-5',
    wallpaperCss: 'radial-gradient(circle at 10% 20%, rgb(239, 246, 249) 0%, rgb(206, 239, 253) 90%)',
  },
  {
    id: 12,
    active: false,
    class: 'bg-color',
    wallpaperClass: 'gradient-6',
    wallpaperCss: 'radial-gradient(circle at 10% 20%, rgb(226, 240, 254) 0%, rgb(255, 247, 228) 90%)',
  },
]

export const sliderSectionSettings = {
  slidesPerView: 3,
  loop: false,
  mousewheel: true,
  modules: [Mousewheel],
  freeMode: {
    enabled: true,
    momentum: true, // smooth sliding
  },
  // breakpoints: {
  //   801: {
  //     slidesPerView: 4,
  //   },
  //   1367: {
  //     slidesPerView: 5,
  //   },
  // },
}

export const ContactPollData = [
  {
    mainClass: 'd-flex align-items-center gap-4',
    contactPoll: [
      { class: 'camera-more-features', icon: 'camera', title: 'Camera' },
      { class: 'contact-more-features', icon: 'contact', title: 'Doc' },
      { class: 'gallery-more-features', icon: 'gallery-fill', title: 'Gallery' },
    ],
  },
  {
    mainClass: 'd-flex align-items-center gap-4',
    contactPoll: [
      { class: 'video-more-features', icon: 'video', title: 'Video' },
      { class: 'audio-more-features', icon: 'audio', title: 'Audio' },
      { class: 'location-more-features', icon: 'location', title: 'Location' },
    ],
  },
]

export const getChatFriendContent = (
  selectedUser: any,
  handlers: {
    handleClearClick: (e: React.MouseEvent) => void
    handleContactClick: (e: React.MouseEvent) => void
    handleToggleSelectionMode: () => void
    handleCloseClick: () => void
    handleReportClick: () => void
    handleDeleteClick: () => void
    handleDeleteBroadcastClick: () => void
    handleDisappearingClick: () => void
    handleLockClick: () => void
  },
) => [
  {
    icon: 'info',
    title: 'contact_info',
    class: 'fill-secondary',
    onClick: handlers.handleContactClick,
    allow: selectedUser?.chat_type !== 'group' && !selectedUser?.isBroadcast,
  },
  {
    icon: 'checkbox',
    title: 'select_message',
    class: 'fill-secondary',
    onClick: handlers.handleToggleSelectionMode,
    allow: true,
  },
  {
    icon: 'disappearing',
    title: 'disappearing_messages',
    class: 'fill-secondary',
    onClick: handlers.handleDisappearingClick,
    allow: !selectedUser.isAnnouncement && !selectedUser?.isBroadcast,
  },
  {
    icon: 'lock-large',
    title: selectedUser.isLocked ? 'unlock_chat' : 'lock_chat',
    class: 'fill-secondary lock-large-svg',
    onClick: handlers.handleLockClick,
    allow: true,
  },
  {
    icon: 'close-chat',
    title: 'close_chat',
    class: 'fill-secondary',
    onClick: handlers.handleCloseClick,
    allow: true,
  },
  {
    icon: 'report-chat',
    title: 'report',
    class: 'fill-secondary',
    onClick: handlers.handleReportClick,
    allow: !selectedUser.isAnnouncement && !selectedUser?.isBroadcast,
  },
  {
    icon: 'clear-chat',
    title: 'clear_chat',
    class: 'fill-secondary clear-chat-svg',
    onClick: handlers.handleClearClick,
    allow: true,
  },
  {
    icon: 'delete-chat',
    title: 'delete_chat',
    class: 'fill-secondary',
    onClick: handlers.handleDeleteClick,
    allow: !selectedUser?.isBroadcast,
  },
  {
    icon: 'delete-chat',
    title: 'delete_broadcast',
    class: 'fill-secondary',
    onClick: handlers.handleDeleteBroadcastClick,
    allow: selectedUser.isBroadcast,
  },
]
