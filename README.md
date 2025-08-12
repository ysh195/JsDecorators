# 목차

[1. 사용 시 유의점](#사용-시-유의점)
1. [코드의 최초 진입점에서의 설정](#1-코드의-최초-진입점에서의-설정)
2. [reflect-metadata의 암시적 사용](#2-reflect-metadata의-암시적-사용)

[2. yshDecorators에서 지원하는 기능](#yshdecorators에서-지원하는-기능)

[3. 각 기능에 대한 설명](#각-기능에-대한-설명)
1. [Injectable](#1-injectable)
2. [InjectedWith](#2-injectedwith)
3. [NesfFactory.create](#3-nesffactorycreate)
4. [Builder](#4-builder)
5. [Validate](#5-validate)
6. [ValidatedWith](#6-validatedwith)
7. [Log](#7-log)

[4. 설치 방법](#설치-방법)

[5. 실행 방법](#실행-방법)

---

# 사용 시 유의점

## 1. 코드의 최초 진입점에서의 설정

**내용**

1. `require('@babel/register')();`가 존재해야 합니다.
2. `NesfFactory.create`를 사용해 인스턴스를 생성해야 합니다.

**예시**

```js
require('@babel/register')();

const { NesfFactory } = require('./yshDecorators/nesfFactory');

// const clazzInstance = NesfFactory.create(clazz);
// .... 등
```

## 2. `reflect-metadata`의 암시적 사용

`@babel` 내에서 사용하기 때문에 직접적으로 사용할 필요는 없지만, 필수적으로 설치되어야 합니다.

---

# yshDecorators에서 지원하는 기능

1. Injectable
2. InjectedWith
3. NesfFactory.create
4. Builder
5. Validate
6. ValidatedWith
7. Log

---

# 각 기능에 대한 설명

## 1. Injectable

**설명**

이 데코레이터를 적용한 클래스는 다른 클래스에 주입 가능한 상태가 됩니다.

**예시**

```js
const { Injectable } = require('./yshDecorators/decorators');

@Injectable()
class A {}
```

---

## 2. InjectedWith

**설명**

1. 앞서 설명한 `Injectable`로 주입 가능한 상태가 된 클래스를, 클래스의 필드로 주입 받습니다.

2. `#`를 사용해서 private 설정된 필드에는 사용할 수 없습니다.

3. `InjectedWith`의 매개변수로 클래스 그 자체를 넣습니다.

**예시**

```js
const { Injectable, InjectedWith } = require('./yshDecorators/decorators');

@Injectable()
class A {}

class B {
    @InjectedWith(A)
    aIntance;
}
```

---

## 3. NesfFactory.create

**설명**

1. `Injectable`과 `InjectedWith`를 이용한 최종 소비자 인스턴스를 생성하는 함수입니다.

2. 이 함수는 프로젝트의 진입점에서 실행해야 합니다.

3. NestJs의 `NestFactory.create()`를 모티브로 네이밍하였습니다.

4. `NesfFactory.create()`의 매개변수로 클래스 그 자체를 넣습니다.

5. "최종 소비자 인스턴스"란?
- B에서 A를 주입 받고,
- C에서 B를 주입 받을 때
- 더 이상 다른 곳에 주입하지 않고, 최종적으로 소비하는 클래스는 C입니다.
- 이 경우, 최종 소비자 인스턴스는 C가 됩니다.

**예시**

```js
require('@babel/register')(); // 예시와는 무관하지만, 무조건 함께 쓰이게 됨

const { NesfFactory } = require('./yshDecorators/nesfFactory');
const { Injectable, InjectedWith } = require('./yshDecorators/decorators');

@Injectable()
class A {}

@Injectable()
class B {
    @InjectedWith(A)
    aIntance;
}

class C {
    @InjectedWith(B)
    bInstance;
}

const cInstance = NesfFactory.create(C);
```

---

## 4. Builder

**설명**

Builder 생성 패턴을 지원하는 데코레이터입니다.

이 데코레이터를 적용한 클래스는
- `builder`로 builder 인스턴스를 생성하고,
- `build`로 본래의 인스턴스를 생성할 수 있습니다.

**예시**

```js
const { Builder } = require('./yshDecorators/decorators');

@Builder()
class A {
    field1;
    field2;

    constructor(){}
}

@Builder()
class B {
    constructor(){
        this.field1;
        this.field2;
    }
}

const a = A.builder().field1(v1).field2(v2).build();
const b = B.builder().field1(v1).field2(v2).build();
```

---

## 5. Validate

**설명**

이 데코레이터를 적용한, 클래스 내 메서드는 입력 받은 매개변수에 대한 유효성 검사를 진행합니다.

단, 매개변수가 되는 인스턴스에 `ValidatedWith` 데코레이터가 적용된 필드가 존재해야 합니다.

**예시**

```js
const { Validate } = require('./yshDecorators/decorators');

class Dto {
    // ... 필드 생략
}

class A {

    @Validate()
    validateDto(dtoInstance) {}
}
```

---

## 6. ValidatedWith

**설명**

이 데코레이터를 적용한 필드를 가진, 인스턴스는 `Validate` 데코레이터가 적용된 함수의 매개변수로 전달되었을 때, 유효성 검사의 대상이 됩니다.

`ValidatedWith`의 매개변수
- `true/false`를 반환하는 조건식 함수(callback) 또는 정규식을 전달해야 합니다.
- 조건식 함수(callback)를 사용할 때, 매개변수는 항상 `value` 하나만 존재해야 합니다.

**예시**

```js
const { Validate, ValidatedWith } = require('./yshDecorators/decorators');

class UserDto {
    @ValidatedWith(value => value.length > 2)
    name;

    @ValidatedWith(value => value > 10)
    age;

    @ValidatedWith(/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i)
    email;

    constructor(name, age, email){
        this.name = name;
        this.age = age;
        this.email = email;
    }
}

class A {

    @Validate()
    validateUserDto(userDtoInstance) {}
}

const userDtoInstance = new UserDto("김철수", 5, "abc@gmail.com");

new A().validateUserDto(userDtoInstance);

// age가 10보다 작으므로 유효성 검사 실패 => 에러 발생
```

---

## 7. Log

**설명**

이 데코레이터를 적용한, 클래스 내 메서드는 매개변수와 리턴값을 `console.log`로 출력합니다.

```js
const { Log } = require('./yshDecorators/decorators');

class A {

    @Log()
    run(v1, v2, v3) {
        return v1;
    }
}

/**
 * 출력 내용
 * [LOG] run 함수 호출 : 매개변수 - v1의 값, v2의 값, v3의 값
 * [LOG] run 함수 결과 : v1의 값
 */
```

---

# 설치 방법

레포지토리 그대로 다운 받아서 터미널에 아래와 같이 입력

```
npm install
```

# 실행 방법

`app.js` 거의 그대로 진입점으로 사용하면 됩니다.

그리고 터미널에 아래와 같이 입력

```
npm run start
```
