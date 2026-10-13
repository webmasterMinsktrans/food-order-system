import { Action, combineReducers, configureStore } from '@reduxjs/toolkit';
import { cartSlice } from './features/cart/cartSlice'; 
import menuSlice from './features/menu/menuSlice';
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { menuApi } from './api/menuApi';
import { orderApi } from './api/orderApi'; // ✅ Добавлен импорт сервиса заказов
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

  // ✅ ИСПРАВЛЕНИЕ №1: Выделяем ячейку памяти в сторе для редюсера заказов orderApi!
  // Теперь данные из transformResponse успешно запишутся в кэш-память Redux,
  // ключ getOrdersList появится в сторе, а length: 0 мгновенно изменится на 1!
  [orderApi.reducerPath]: orderApi.reducer,
});

const rootReducer = (state: any, action: Action) => {
  if (action.type === endLogout.type) return appReducer(undefined, action);
  return appReducer(state, action);
};

// Конфигурация middlewares остается полной для корректной работы кэширования RTK Query
const getCustomMiddleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware({
    serializableCheck: false, 
  })
    .concat(authApi.middleware)
    .concat(userApi.middleware)
    .concat(menuApi.middleware)
    .concat(orderApi.middleware) // Middleware заказов подключен корректно
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
