import { Action, combineReducers, configureStore } from '@reduxjs/toolkit';
import { cartSlice } from './features/cart/cartSlice'; 
import menuSlice from './features/menu/menuSlice';
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { menuApi } from './api/menuApi';
import { orderApi } from './api/orderApi';
import userSlice, { endLogout } from './features/user/userSlice';
import { baseApiWithAuth, baseApiWithoutAuth } from './api/baseApi';
import { persistReducer, persistStore } from 'redux-persist';
import { sessionStorage } from './storage';

// ✅ ИСПРАВЛЕНИЕ №1: Создаем изолированную конфигурацию сохранения СТРОГО для корзины.
// Мы убираем глобальный persist всего стора, который стирал кэш списков заказов.
const cartPersistConfig = {
  key: "cart",
  storage: sessionStorage,
};

// Оборачиваем в persistReducer ТОЛЬКО редюсер корзины
const persistedCartReducer = persistReducer(cartPersistConfig, cartSlice.reducer);

const appReducer = combineReducers({
  cart: persistedCartReducer, // ✅ Теперь сохраняется исключительно корзина, кэш API в полной безопасности
  menu: menuSlice,
  user: userSlice,
  
  [authApi.reducerPath]: authApi.reducer,
  [baseApiWithoutAuth.reducerPath]: baseApiWithoutAuth.reducer,
  
  // Главный редюсер авторизованной базы, в который входят userApi, menuApi и orderApi.
  // Теперь его кэш больше никогда не сотрется экшеном REHYDRATE.
  [baseApiWithAuth.reducerPath]: baseApiWithAuth.reducer,
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
    .concat(orderApi.middleware)
    .concat(baseApiWithoutAuth.middleware)
    .concat(baseApiWithAuth.middleware);

export const makeStore = () => configureStore({
  reducer: rootReducer, // ✅ Передаем чистый rootReducer вместо глобального persistedReducer
  middleware: getCustomMiddleware,
});

export const store = configureStore({
  reducer: rootReducer, // ✅ Передаем чистый rootReducer
  middleware: getCustomMiddleware,
});

export const persistedStore = typeof window !== 'undefined' 
  ? persistStore(store) 
  : ({ getActions: () => [], dispatch: () => {}, subscribe: () => () => {} } as any);

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
