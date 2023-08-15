import numpy as np
from itertools import product

# 좌표 목록 생성
coordinates = [9155264, 9155349, 9156199, 9156215, 9156642]

# 가능한 모든 값 목록 생성
possible_values = np.arange(10)

# 가능한 모든 값에 대해 좌표를 반복
for values in product(possible_values, repeat=3):
    # print(values)/
    # 좌표를 해독
    coordinates_decoded = [str(value) for value in values]
    decoded_coordinate = "".join(coordinates_decoded)

    # 좌표가 알려진 좌표 중 하나와 일치하는지 확인
    if decoded_coordinate in coordinates:
        # 좌표가 일치합니다!
        print(decoded_coordinate)
        break

