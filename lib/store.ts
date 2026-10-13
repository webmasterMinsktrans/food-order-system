import { Action, combineReducers, configureStore } from '@reduxjs/toolkit';
import { cartSlice } from './features/cart/cartSlice'; 
import menuSlice from './features/menu/menuSlice';
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { menuApi } from './api/menuApi';
import { orderApi } from './api/orderApi';
import { moderatorApi } from './api/moderatorApi'; // ✅ Добавлен импорт модератора
import { adminApi } from './api/adminApi';         // ✅ Добавлен импорт админа
import userSlice, { endLogout } from './features/user/userSlice';
import { baseApiWithAuth, baseApiWithoutAuth } from './api/baseApi';
import { persistReducer, persistStore } from 'redux-persist';
import { sessionStorage } from './storage';

const cartPersistConfig = {
  key: "cart",
  storage: sessionStorage,
};

const persistedCartReducer = persistReducer(cartPersistConfig, cartSlice.reducer);

const appReducer = combineReducers({
  cart: persistedCartReducer, 
  menu: menuSlice,
  user: userSlice,
  
  // Корневые независимые API сервисы
  [authApi.reducerPath]: authApi.reducer,
  [baseApiWithoutAuth.reducerPath]: baseApiWithoutAuth.reducer,
  [baseApiWithAuth.reducerPath]: baseApiWithAuth.reducer,
  [orderApi.reducerPath]: orderApi.reducer,
  [moderatorApi.reducerPath]: moderatorApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
});

const rootReducer = (state: any, action: Action) => {
  if (action.type === endLogout.type) return appReducer(undefined, action);
  return appReducer(state, action);
};

// Конфигурация middlewares остается полной для всех сервисов
const getCustomMiddleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware({
    serializableCheck: false, 
  })
    .concat(authApi.middleware)
    .concat(userApi.middleware)
    .concat(menuApi.middleware)
    .concat(orderApi.middleware)
    .concat(moderatorApi.middleware) // ✅ Middleware модератора
    .concat(adminApi.middleware)     // ✅ Middleware админа
    .concat(baseApiWithoutAuth.middleware)
    .concat(baseApiWithAuth.middleware);

export const makeStore = () => configureStore({
  reducer: rootReducer, 
  middleware: getCustomMiddleware,
});

export const store = configureStore({
  reducer: rootReducer, 
  middleware: getCustomMiddleware,
});

export const persistedStore = typeof window !== 'undefined' 
  ? persistStore(store) 
  : ({ getActions: () => [], dispatch: () => {}, subscribe: () => () => {} } as any);

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

