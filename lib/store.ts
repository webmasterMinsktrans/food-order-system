import { Action, combineReducers, configureStore } from '@reduxjs/toolkit';
import { cartSlice } from './features/cart/cartSlice'; // Именованный импорт чистого слайса
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
  cart: cartSlice.reducer, // Чистый оригинальный редюсер без двойного persist
  menu: menuSlice,
  user: userSlice,
  
  // ✅ УНИКАЛЬНЫЙ КЛЮЧ 1: Авторизация/Вход (свой собственный обособленный редюсер)
  [authApi.reducerPath]: authApi.reducer,
  
  // ✅ УНИКАЛЬНЫЙ КЛЮЧ 2: Базовые публичные эндпоинты без токенов (например, регистрация)
  [baseApiWithoutAuth.reducerPath]: baseApiWithoutAuth.reducer,
  
  // ✅ УНИКАЛЬНЫЙ КЛЮЧ 3: Главный редюсер авторизованной базы.
  // Сюда автоматически инкапсулируются данные из userApi, menuApi и orderApi.
  // Мы удалили их дубликаты выше, чтобы избавиться от ошибки "multiple properties with the same name"
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

// Конфигурация middlewares остается полной — это нужно для корректной работы кэширования RTK Query
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
