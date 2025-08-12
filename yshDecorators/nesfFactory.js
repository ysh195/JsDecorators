const diContainer = require('./diContainer');

/**
 * 최종 소비자 인스턴스를 반환하는 함수
 * 재귀적으로 의존성을 해결하여 인스턴스를 생성합니다.
 * @param {class} clazz 
 * @returns {class} - instance
 */
function create(clazz) {
    if (diContainer.has(clazz) && diContainer.get(clazz))
        return diContainer.get(clazz);

    const instance = new clazz();

    const injections = clazz.prototype.__injections || [];
    for (const { propertyKey, token } of injections) {
        instance[propertyKey] = create(token);
    }

    diContainer.set(clazz, instance);

    return instance;
}

/**
 * NestFactory를 모방한 객체
 */
const NesfFactory = { create };

module.exports = { NesfFactory };
