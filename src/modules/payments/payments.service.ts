import { Injectable } from '@nestjs/common';
import { PaymentsMicroserviceService } from '~/microservices/payments/payments.service';
import { ChangePaymentStatusDTO } from './dto/change-payment-status.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsService: PaymentsMicroserviceService) {}

  async changeStatus(data: ChangePaymentStatusDTO) {
    const successStatus = ['paid'];
    const cancelStatus = ['refused'];
    const refundStatus = ['refunded'];
    const reverseStatus = ['chargedback'];

    let ok = false;
    try {
      const approve = successStatus.includes(data.status);
      const reverse = reverseStatus.includes(data.status);
      const refund = refundStatus.includes(data.status);
      const cancel = cancelStatus.includes(data.status);

      const boletoUrl = data.transaction?.boleto_url;

      const paymentData = {
        paymentId: data.paymentId,
        transactionId: data.transaction?.id,
        provider: data.provider,
        notificationCode: data.notificationCode,
        boleto: {
          boletoUrl
        }
      };
      if (approve) {
        await this.paymentsService.approve(paymentData);
      } else if (cancel) {
        await this.paymentsService.cancel(paymentData);
      } else if (reverse) {
        await this.paymentsService.reverse(paymentData);
      } else if (refund) {
        await this.paymentsService.refund(paymentData);
      }

      await this.paymentsService.update({
        paymentId: data.paymentId,
        ...(data.transaction?.boleto_url && {
          boleto: { url: data.transaction.boleto_url }
        }),
        ...((data.transaction?.card_brand ||
          data.transaction?.card_last_digits) && {
          creditCard: {
            ...(data.transaction?.card_brand && {
              brand: data.transaction?.card_brand
            }),
            ...(data.transaction?.card_last_digits && {
              lastFourNumbers: data.transaction?.card_last_digits
            })
          }
        })
      });
    } catch (error) {}
    return {
      ok
    };
  }
}
