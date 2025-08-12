const diContainer = require('./diContainer');

/**
 * 이 데코레이터를 적용한 클래스는 다른 클래스에 주입할 수 있습니다.
 * 적용된 클래스를 DI 컨테이너에 등록하는 기능입니다.
 * @returns {function} - 데코레이터 함수 
 */
function Injectable() {
    return function (target) {
        diContainer.set(target, null);
    };
}

/**
 * 이 데코레이터를 적용한, 클래스 내 필드는 다른 클래스의 인스턴스를 주입받습니다.
 * 주입할 클래스는 반드시 `@Injectable()` 데코레이터가 적용되어 있어야 합니다.
 * 이 필드가 포함된 클래스에, 주입 받을 인스턴스 정보를 마킹하는 기능입니다.
 * @param {class} clazz - 주입할 클래스
 * @returns {function} - 데코레이터 함수
 */
function InjectedWith(clazz) {
    return function (target, propertyKey) {
        if (!target.hasOwnProperty("__injections")) {
            Object.defineProperty(target, "__injections", {
                value: [],
                enumerable: false,
                configurable: false,
                writable: false
            });
        }

        target.__injections.push({ propertyKey, clazz });
    };
}

/**
 * Builder 패턴을 적용할 수 있는 데코레이터입니다.
 * @returns {function} - 데코레이터 함수
 */
function Builder() {
    return function (target, context) {
        if (context.kind !== "class") throw new Error("@Builder는 클래스에만 사용할 수 있습니다.");

        return class extends target {
            static builder(...args) {
                const instance = new target(...args);

                let obj = {
                    BUILDER_OBJ_DATA: {},
                    build: () => {
                        for (const key in obj.BUILDER_OBJ_DATA) {
                            instance[key] = obj.BUILDER_OBJ_DATA[key];
                        }

                        return instance;
                    }
                };

                for (const field in instance) {
                    if (typeof instance[field] !== "function") {
                        obj[field] = (value) => {
                            obj.BUILDER_OBJ_DATA[field] = value;
                            return obj;
                        };
                    }
                }

                return obj;
            }
        };
    };
}

/**
 * 이 데코레이터를 적용한 필드를 가진, 인스턴스는
 * `Validate` 데코레이터가 적용된 함수의 매개변수로 전달되었을 때,
 * 유효성 검사의 대상이 됩니다.
 * @param {function} condition - 유효성 검사 조건 함수 또는 정규 표현식.
 * 함수로 사용할 시 매개변수는 반드시 value 하나만 가능합니다.
 * @returns {function} - 데코레이터 함수
 */
function ValidatedWith(condition) {
    return function (target, propertyKey) {
        if (!target.__validations) target.__validations = {};
        target.__validations[propertyKey] = condition;
    };
}

/**
 * 이 데코레이터를 적용한, 클래스 내 메서드는 입력 받은 매개변수에 대한 유효성 검사를 진행합니다.
 * 단, 매개변수가 되는 인스턴스에 `ValidatedWith` 데코레이터가 적용된 필드가 존재해야 합니다.
 * @returns {function} - 데코레이터 함수
 * @throws {Error} - 유효성 검사 실패 시 예외를 발생시킵니다.
 */
function Validate() {
    return function (target, propertyKey, descriptor) {
        if (!descriptor) throw new Error('@Validate는 메서드에만 붙여야 합니다.');

        const original = descriptor.value;

        descriptor.value = function (...args) {
            for (const arg of args) {
                if (!arg || typeof arg !== 'object') continue;

                const proto = Object.getPrototypeOf(arg);

                if (!proto || !proto.__validations) continue;

                for (const field in proto.__validations) {
                    const validator = proto.__validations[field];
                    const value = arg[field];

                    if (typeof validator === 'function') {
                        if (!validator(value)) throw new Error(`${field} - 유효성 검사 실패`);
                    } else if (validator instanceof RegExp) {
                        if (!validator.test(value)) throw new Error(`${field} - 유효성 검사 실패`);
                    }
                }
            }

            return original.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * 이 데코레이터를 적용한, 클래스 내 메서드는
 * 매개변수와 리턴값을 `console.log`로 출력합니다.
 * @returns {function} - 데코레이터 함수
 */
function Log() {
    return function (target, propertyKey, descriptor) {
        if (!descriptor) throw new Error("@Log는 메서드에만 사용해야 합니다.");

        const original = descriptor.value;

        descriptor.value = function (...args) {
            console.log(`[LOG] ${propertyKey} 함수 호출 : 매개변수 -`, args);

            const result = original.apply(this, args);

            console.log(`[LOG] ${propertyKey} 함수 결과 :`, result);

            return result;
        };

        return descriptor;
    };
}

module.exports = {
    Injectable,
    InjectedWith,
    Builder,
    Validate,
    ValidatedWith,
    Log,
};
