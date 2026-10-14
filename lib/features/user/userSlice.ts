import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { localStorage, sessionStorage } from '../../storage';

interface UserState {
  isLoggingOut: boolean,
  isLoggedIn?: boolean,
  role?: string | null,
  interface: string | null,
}

const initialState: UserState = {
  isLoggingOut: false,
  isLoggedIn: undefined,
  role: undefined,
  interface: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<string>)=>{
      state.isLoggedIn = true;
      const formattedRole = action.payload.replaceAll('_', '-');
      state.role = formattedRole;
      
      // МАСКИРОВКА: Если роль admin, принудительно подменяем путь на control-panel
      state.interface = formattedRole === 'admin' ? 'control-panel' : formattedRole;
    },
    startLogout: (state) => {
      state.isLoggingOut = true;
      state.isLoggedIn = false;
      state.role = null;
      state.interface = null;
    },
    endLogout: (state) => {
      state.isLoggingOut = false;
      state.isLoggedIn = false;
      state.role = null;
      state.interface = null;
      localStorage.removeItem('persist:user');
      sessionStorage.removeItem('persist:cart');
    },
    initializeUserData: (state, action: PayloadAction<{ isLoggedIn: boolean, role: string | null }>) => {
      state.isLoggedIn = action.payload.isLoggedIn;
      const formattedRole = action.payload.role?.replaceAll('_', '-') ?? null;
      state.role = formattedRole;
      
      if (!state.interface) {
        // МАСКИРОВКА: Подменяем интерфейс при инициализации сессии пользователя
        state.interface = formattedRole === 'admin' ? 'control-panel' : formattedRole;
      }
    },
    changeUserInterface: (state, action: PayloadAction<string>)=>{
      const formattedInterface = action.payload.replaceAll('_', '-');
      // МАСКИРОВКА: Если происходит ручное переключение интерфейса на admin
      state.interface = formattedInterface === 'admin' ? 'control-panel' : formattedInterface;
    }
  },
  selectors: {
    selectIsLoggingOut: (state: UserState) => state.isLoggingOut,
    selectIsLoggedIn: (state) => state.isLoggedIn,
    selectUserRole: (state) => state.role,
    selectUserInterface: (state) => state.interface,
  },
});

export const { selectIsLoggingOut, selectIsLoggedIn, selectUserRole, selectUserInterface } = userSlice.selectors;
export const { startLogout, endLogout, login, initializeUserData, changeUserInterface } = userSlice.actions;

const userPersistConfig = {
  key: "user",
  storage: localStorage,
  whitelist: ["interface"],
};

const persistedReducer = persistReducer(userPersistConfig, userSlice.reducer);

export default persistedReducer;
