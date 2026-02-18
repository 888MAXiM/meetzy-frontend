import { createSlice } from "@reduxjs/toolkit";
import { contactStatusData, favoriteData, notificationData } from "../../../data/messenger";

const initialState = {
  mainSidebarActiveTab: "",
  mainSidebarWidth: 0,
  contactStatusActive: contactStatusData,
  notificationActive: notificationData,
  favoriteActive: Array(favoriteData.length).fill(false),
  selected: "1",
  account: "1",
  settingsActiveTab: "",
};

const MainSidebarSlice = createSlice({
  name: "MainSidebarSlice",
  initialState,
  reducers: {
    setMainSidebarActiveTab: (state, action) => {
      state.mainSidebarActiveTab = action.payload;
      document.querySelector(".recent-default")?.classList.remove("active");
      if (state.mainSidebarWidth < 800) document.querySelector(".app-sidebar")?.classList.remove("active");
    },
    setMainSidebarWidth: (state, action) => {
      state.mainSidebarWidth = action.payload;
    },
    closeLeftSide: (state) => {
      document.querySelector(".recent-default")?.classList.add("active");
      state.mainSidebarActiveTab = "";
    },
    setContactStatusActive: (state, action) => {
      state.selected = action.payload;
      state.contactStatusActive = state.contactStatusActive.map((item) => (item.id === action.payload ? { ...item, status: true } : item));
    },
    setContactActive: (state, action) => {
      state.selected = action.payload;
      state.contactStatusActive = state.contactStatusActive.map((item) => (item.id === action.payload ? { ...item, active: true } : { ...item, active: false }));
    },
    setNotificationActive: (state, action) => {
      state.notificationActive = state.notificationActive.filter((_, i) => i !== action.payload);
    },
    setFavoriteActive: (state, action) => {
      state.favoriteActive = state.favoriteActive.map((item, i) => (i === action.payload ? !item : item));
    },
    setSettingsActiveTab: (state, action) => {
      state.settingsActiveTab = action.payload;
    },
    setAccount: (state, action) => {
      state.account = action.payload;
    },
  },
});

export const { setMainSidebarActiveTab, setMainSidebarWidth, closeLeftSide, setContactStatusActive, setNotificationActive, setFavoriteActive, setSettingsActiveTab, setAccount, setContactActive } = MainSidebarSlice.actions;

export default MainSidebarSlice.reducer;
