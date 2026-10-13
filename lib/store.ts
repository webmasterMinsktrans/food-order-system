import { Action, combineReducers, configureStore } from '@reduxjs/toolkit';
import { cartSlice } from './features/cart/cartSlice'; // ✅ ИСПРАВЛЕНИЕ №1: Импортируем чистый слайс (именованный импорт)
import menuSlice from './features/menu/menuSlice';
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { menuApi } from './api/menuApi';
import { orderApi } from './api/orderApi';
import userSlice, { endLogout } from './features/user/userSlice';
import { baseApiWithAuth, baseApiWithoutAuth } from './api/baseApi';
import { persistReducer, persistStore } from 'redux-persist';
import { sessionStorage } from './storage';

const appReducer = combineReducers({
  cart: cartSlice.reducer, // ✅ ИСПРАВЛЕНИЕ №2: Передаем чистый оригинальный редюсер без двойного persist
  menu: menuSlice,
  user: userSlice,
  [authApi.reducerPath]: authApi.reducer,
  [userApi.reducerPath]: userApi.reducer,   
  [menuApi.reducerPath]: menuApi.reducer,   
  [orderApi.reducerPath]: orderApi.reducer,
  [baseApiWithoutAuth.reducerPath]: baseApiWithoutAuth.reducer,
  [baseApiWithAuth.reducerPath]: baseApiWithAuth.reducer,
});

const rootReducer = (state: any, action: Action) => {
  if (action.type === endLogout.type) return appReducer(undefined, action);
  return appReducer(state, action);
};

const rootPersistConfig = {
  key: "root",
  storage: sessionStorage,
  whitelist: ["cart"], // Глобальный стор sessionStorage будет корректно сохранять вашу корзину
};

const rootPersistedReducer = persistReducer(rootPersistConfig, rootReducer);

const getCustomMiddleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware({
    serializableCheck: false, 
  })
    .concat(authApi.middleware)
    .concat(userApi.middleware)
    .concat(menuApi.middleware)
    .concat(orderApi.middleware)
    .concat(baseApiWithoutAuth.middleware)
    .concat(baseApiWithAuth.middleware);

export const makeStore = () => configureStore({
  reducer: rootPersistedReducer,
  middleware: getCustomMiddleware,
});

export const store = configureStore({
  reducer: rootPersistedReducer,
  middleware: getCustomMiddleware,
});

export const persistedStore = typeof window !== 'undefined' 
  ? persistStore(store) 
  : ({ getActions: () => [], dispatch: () => {}, subscribe: () => () => {} } as any);

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
