import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    dataSet?: Record<string, any>;
    'data-cy'?: string;
  }
  interface TextProps {
    dataSet?: Record<string, any>;
    'data-cy'?: string;
  }
  interface TextInputProps {
    dataSet?: Record<string, any>;
    'data-cy'?: string;
  }
  interface TouchableOpacityProps {
    dataSet?: Record<string, any>;
    'data-cy'?: string;
  }
  interface PressableProps {
    dataSet?: Record<string, any>;
    'data-cy'?: string;
  }
  interface ScrollViewProps {
    dataSet?: Record<string, any>;
    'data-cy'?: string;
  }
  interface FlatListProps<ItemT> {
    dataSet?: Record<string, any>;
    'data-cy'?: string;
  }
}
