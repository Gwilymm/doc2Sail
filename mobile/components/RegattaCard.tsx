import { TouchableOpacity, View, Text } from 'react-native';

type Regatta = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  location?: string;
};

type Props = {
  regatta: Regatta;
  onPress: () => void;
};

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const startDay = start.getDate();
  const endDay = end.getDate();

  const startMonth = start.toLocaleDateString('fr-FR', { month: 'long' });
  const endMonth = end.toLocaleDateString('fr-FR', { month: 'long' });
  const endYear = end.getFullYear();

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${startDay} – ${endDay} ${endMonth} ${endYear}`;
  }

  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
}

export function RegattaCard({ regatta, onPress }: Props) {
  const dateRange = formatDateRange(regatta.startDate, regatta.endDate);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-white rounded-card px-4 py-4 flex-row items-start"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Sailing accent */}
      <View className="w-10 h-10 rounded-full bg-sky-50 items-center justify-center mr-3 mt-0.5 shrink-0">
        <Text style={{ fontSize: 20, lineHeight: 24 }}>⛵</Text>
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          className="text-base-content font-bold text-lg leading-snug"
          numberOfLines={2}
        >
          {regatta.name}
        </Text>

        <Text className="text-gray-500 text-sm mt-1">{dateRange}</Text>

        {regatta.location ? (
          <View className="flex-row items-center mt-1">
            <Text className="text-gray-400 text-xs mr-1">📍</Text>
            <Text className="text-gray-400 text-xs" numberOfLines={1}>
              {regatta.location}
            </Text>
          </View>
        ) : null}

        {regatta.description ? (
          <Text
            className="text-gray-400 text-xs mt-2 leading-relaxed"
            numberOfLines={2}
          >
            {regatta.description}
          </Text>
        ) : null}
      </View>

      {/* Chevron */}
      <Text className="text-gray-300 text-lg ml-2 mt-1">›</Text>
    </TouchableOpacity>
  );
}
