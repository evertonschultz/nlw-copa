import { createContext, ReactNode, useEffect, useState } from "react";
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '../services/api';
import { useToast } from "native-base";

WebBrowser.maybeCompleteAuthSession();

interface UserProps {
  name: string;
  avatarUrl: string;
}

export interface AuthContextDataProps {
  user: UserProps;
  isUserLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithStorageToken: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}
export const AuthContext = createContext({} as AuthContextDataProps);

export function AuthContextProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProps>({} as UserProps);
  const [isUserLoading, setIsUserLoading] = useState(false)

  const toast = useToast();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    scopes: ['profile', 'email']
  })

  async function signIn() {
    try {
      setIsUserLoading(true)
  
      await promptAsync();
    } catch (error) {
      console.log(error)
      throw error;
    } finally {
      setIsUserLoading(false)
    }
  }

  async function signOut() {
    try {
      await AsyncStorage.removeItem('@nlw-copa:user-token');
      setUser({} as UserProps);
    } catch (error) {
      console.log(error)

      toast.show({
        title: 'Não foi possível deslogar da aplicação.',
        placement: 'top',
        bgColor: 'red.500'
      })
    }
  }

  async function signInWithGoogle(access_token: string) {
    await AsyncStorage.setItem('@nlw-copa:user-token', access_token);

    try {
      setIsUserLoading(true)

      const tokenResponse = await api.post('/users', { access_token })
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.data.token}`

      const userInfoResponse = await api.get('/me');
      setUser(userInfoResponse.data.user)
    } catch (error) {
      console.log(error)
    } finally {
      setIsUserLoading(false)
    }
  }

  async function signInWithStorageToken() {
    try {
      setIsUserLoading(true)

      const access_token = await AsyncStorage.getItem('@nlw-copa:user-token')
      if(access_token !== null) {
        return signInWithGoogle(access_token)
      }
    } catch (error) {} finally {
      setIsUserLoading(false)
    }
  }

  useEffect(() => {
    if(response?.type === 'success' && response.authentication?.accessToken) {
      signInWithGoogle(response.authentication.accessToken)
    }
  }, [response])

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        signInWithStorageToken,
        isUserLoading,
        user,
      }}
    >
      { children }
    </AuthContext.Provider>
  )
}