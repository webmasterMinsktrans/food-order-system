import { Action, combineReducers, configureStore } from '@reduxjs/toolkit';
import { cartSlice } from './features/cart/cartSlice'; 
import menuSlice from './features/menu/menuSlice';
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { menuApi } from './api/menuApi';
import { orderApi } from './api/orderApi';
import { moderatorApi } from './api/moderatorApi'; 
import { adminApi } from './api/adminApi';         
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
  
  // Уникальные изолированные слоты памяти Redux стора
  [authApi.reducerPath]: authApi.reducer,
  [baseApiWithoutAuth.reducerPath]: baseApiWithoutAuth.reducer,
  
  // ✅ Единственный корневой редюсер авторизованной базы. 
  // Сюда автоматически инкапсулируются данные из userApi, menuApi, moderatorApi и adminApi.
  // Мы удалили дубликаты свойств ниже, что полностью устраняет ошибку компиляции TypeScript!
  [baseApiWithAuth.reducerPath]: baseApiWithAuth.reducer,
  
  // Отдельная ячейка памяти для независимого сервиса заказов
  [orderApi.reducerPath]: orderApi.reducer,
});

const rootReducer = (state: any, action: Action) => {
  if (action.type === endLogout.type) return appReducer(undefined, action);
  return appReducer(state, action);
};

// ✅ Оставляем цепочку middlewares полной! Это критически важно для Next.js 15.4.10,
// чтобы события кэширования и автообновления тегов (providesTags) в админке работали без сбоев.
const getCustomMiddleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware({
    serializableCheck: false, 
  })
    .concat(authApi.middleware)
    .concat(userApi.middleware)
    .concat(menuApi.middleware)
    .concat(orderApi.middleware)
    .concat(moderatorApi.middleware) 
    .concat(adminApi.middleware)     
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
