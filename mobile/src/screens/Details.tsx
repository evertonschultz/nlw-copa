import { HStack, useToast, VStack } from "native-base";
import { useRoute } from '@react-navigation/native'
import { useEffect, useState } from "react";
import { api } from "../services/api";

import { Header } from "../components/Header";
import { Loading } from "../components/Loading";
import { PoolPros } from "../components/PoolCard";
import { PoolHeader } from "../components/PoolHeader";
import { EmptyMyPoolList } from "../components/EmptyMyPoolList";
import { Option } from "../components/Option";
import { Share } from "react-native";
import { Guesses } from "../components/Guesses";

interface RouteParams {
  id: string;
}

export function Details() {
  const [isLoading, setIsLoading] = useState(true)
  const [pool, setPool] = useState<PoolPros>({} as PoolPros)
  const [option, setOption] = useState<'guesses' | 'ranking'>('guesses')

  const route = useRoute();
  const toast = useToast();

  const { id } = route.params as RouteParams;

  async function fetchPool() {
    try {
      setIsLoading(true)
      
      const response = await api.get(`/pools/${id}`);
      
      setPool(response.data.pool)      
    } catch (error) {
      console.log(error)
      
      toast.show({
        title: 'Não foi possível carregar os detalhes do bolão.',
        placement: 'top',
        bgColor: 'red.500'
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCodeShare() {
    await Share.share({
      message: pool.code
    })
  }

  useEffect(() => {fetchPool()}, [id])

  if (isLoading) {
    return <Loading />
  }

  return (
    <VStack flex={1} bgColor="gray.900">
      <Header 
        title={pool.title}
        showBackButton
        showShareButton
        onShare={handleCodeShare}
      />

      {
        pool._count?.participants > 0
        ?
          <VStack px={5} flex={1}>
            <PoolHeader data={pool} />

            <HStack bgColor="gray.800" p={1} rounded="sm" mb={5}>
              <Option
                title="Seus Palpites"
                isSelected={option === 'guesses'}
                onPress={() => setOption('guesses')}
              />
              <Option
                title="Ranking do Grupo"
                isSelected={option === 'ranking'}
                onPress={() => setOption('ranking')}
              />
            </HStack>

            <Guesses poolId={pool.id} code={pool.code} />
          </VStack>
        :
          <EmptyMyPoolList code={pool.code} />
      }
    </VStack>
  )
}