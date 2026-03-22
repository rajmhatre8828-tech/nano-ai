import { useRouter } from 'expo-router';
import { CloudAlert, Lightbulb } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useModels } from '@/hooks/use-models';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';

export default function ModalScreen() {
  const router = useRouter();
  const [, setSettings] = useSettings();
  const { models, currentModel, fetchModels, setCurrentModel } = useModels();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchModels()
      .catch(setError)
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <View className="flex h-full flex-1 items-center justify-center">
        <CloudAlert size={44} />
        <Text className="text-xl font-medium">Models discovering error</Text>
        <Text className="text-muted-foreground">{`${error.message}`}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex h-full flex-1 items-center justify-center gap-y-1">
        <Spinner className="size-6" />
        <Text>Discovering available models...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View className="pb-safe flex gap-y-1 py-5 pt-2">
        {models.map(model => {
          const { name, canThink } = model;
          const isCurrent = name === currentModel?.name;

          return (
            <Button
              key={name}
              variant="ghost"
              className={cn('flex flex-row justify-between', isCurrent ? 'bg-accent' : '')}
              onPress={() => {
                setCurrentModel(model);
                setSettings(settings => {
                  settings.defaultModel = model;
                });
                router.dismiss();
              }}>
              <Text className="text-base">{name}</Text>
              {canThink ? (
                <Badge variant="secondary" className="rounded-full">
                  <Icon as={Lightbulb} className="text-blue-500" />
                </Badge>
              ) : null}
            </Button>
          );
        })}
      </View>
    </ScrollView>
  );
}
